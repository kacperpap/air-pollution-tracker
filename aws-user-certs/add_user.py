import os
from pathlib import Path
import base64
import sys
from OpenSSL import crypto # type: ignore
import subprocess

PROJECT_ROOT = Path(__file__).resolve().parent.parent 
CERTS_DIR = PROJECT_ROOT / "aws-user-certs"
TEMPLATES_DIR = CERTS_DIR / "templates"
TERRAFORM_DIR = PROJECT_ROOT / "terraform" / "infrastructure"


def generate_key_and_csr(username):
    
    key = crypto.PKey()
    key.generate_key(crypto.TYPE_RSA, 2048)

    csr = crypto.X509Req()
    csr.get_subject().CN = username
    csr.set_pubkey(key)
    csr.sign(key, "sha256")

    return key, csr


def save_key_and_csr(key, csr, username):
    
    user_dir = CERTS_DIR / username
    user_dir.mkdir(parents=True, exist_ok=True)

    key_path = user_dir / f"{username}.key"
    with open(key_path, "wb") as key_file:
        key_file.write(crypto.dump_privatekey(crypto.FILETYPE_PEM, key))

    csr_path = user_dir / f"{username}.csr"
    with open(csr_path, "wb") as csr_file:
        csr_file.write(crypto.dump_certificate_request(crypto.FILETYPE_PEM, csr))

    return key_path, csr_path


def create_csr_yaml(username, csr_path):

    with open(TEMPLATES_DIR / "csr-template.yaml", "r") as template_file:
        template_content = template_file.read()

    with open(csr_path, "rb") as csr_file:
        csr_base64 = base64.b64encode(csr_file.read()).decode()

    csr_yaml_content = template_content.replace("<USER>", username).replace("BASE64_ENCODED_CSR", csr_base64)

    user_dir = CERTS_DIR / username
    csr_yaml_path = user_dir / f"{username}-csr.yaml"
    with open(csr_yaml_path, "w") as yaml_file:
        yaml_file.write(csr_yaml_content)

    return csr_yaml_path


def create_role_binding(username, role_type):

    with open(TEMPLATES_DIR / "rolebinding-template.yaml", "r") as template_file:
        template_content = template_file.read()

    if role_type == "admin":
        role_kind = "ClusterRole"
        role_name = "apt-administrator"
    elif role_type == "developer":
        role_kind = "Role"
        role_name = "apt-developer"
    else:
        raise ValueError("Invalid role_type. Must be 'admin' or 'developer'.")

    role_binding_content = (
        template_content.replace("<USER>", username)
        .replace("<ROLE_KIND>", role_kind)
        .replace("<ROLE>", role_name)
    )

    user_dir = CERTS_DIR / username
    role_binding_path = user_dir / f"{username}-binding.yaml"
    with open(role_binding_path, "w") as binding_file:
        binding_file.write(role_binding_content)

    return role_binding_path

def generate_kubeconfig(user_name, key_path, cert_path, cluster_name, cluster_endpoint, ca_data):
    kubeconfig_path = os.path.join(CERTS_DIR, user_name, "kubeconfig.yaml")
    kubeconfig_template = f"""
apiVersion: v1
kind: Config
clusters:
- name: {cluster_name}
  cluster:
    server: {cluster_endpoint}
    certificate-authority-data: {ca_data}
contexts:
- name: {user_name}-context
  context:
    cluster: {cluster_name}
    user: {user_name}
current-context: {user_name}-context
users:
- name: {user_name}
  user:
    client-certificate: {cert_path}
    client-key: {key_path}
"""
    with open(kubeconfig_path, "w") as kubeconfig_file:
        kubeconfig_file.write(kubeconfig_template)
    print(f"Kubeconfig for {user_name} saved to {kubeconfig_path}")


def connect_to_cluster(cluster_name, region):

    print(f"Connecting to cluster {cluster_name} in region {region}...")
    run_command(f"aws eks update-kubeconfig --name {cluster_name} --region {region}")


def apply_to_cluster(file_path):
    run_command(f"kubectl apply -f {file_path}")


def run_command(command, capture_output=False):
    try:
        result = subprocess.run(command, shell=True, capture_output=capture_output, text=True, check=True)
        return result.stdout.strip() if capture_output else None
    except subprocess.CalledProcessError as e:
        print(f"Error executing command: {command}\n{e}")
        raise


def main():
    username = None
    role_type = None

    if len(sys.argv) > 1:
        username = sys.argv[1]
    if len(sys.argv) > 2:
        role_type = sys.argv[2].lower()

    if not username:
        username = input("Podaj nazwę użytkownika: ").strip()
    if role_type not in ["admin", "developer"]:
        role_type = input("Podaj typ roli (admin/developer): ").strip().lower()

    if role_type not in ["admin", "developer"]:
        print("Nieprawidłowy typ roli. Wybierz 'admin' lub 'developer'.")
        return

    # 1. Generowanie klucza prywatnego i CSR
    key, csr = generate_key_and_csr(username)
    key_path, csr_path = save_key_and_csr(key, csr, username)
    print(f"Klucz prywatny zapisany: {key_path}")
    print(f"CSR zapisany: {csr_path}")

    # 2. Generowanie pliku YAML dla CSR
    csr_yaml_path = create_csr_yaml(username, csr_path)
    print(f"CSR YAML zapisany: {csr_yaml_path}")

    # 3. Generowanie RoleBinding dla użytkownika
    role_binding_path = create_role_binding(username, role_type)
    print(f"RoleBinding YAML zapisany: {role_binding_path}")

    # 4. Łączenie z klastrem
    try:
        connect_to_cluster("apt", "eu-central-1")

        # 5. Aplikowanie CSR na klastrze
        print("Aplikowanie CSR na klastrze...")
        apply_to_cluster(csr_yaml_path)

        # 6. Zatwierdzanie CSR i pobieranie certyfikatu
        print("Zatwierdzanie CSR...")
        run_command(f"kubectl certificate approve {username}")

        print("Pobieranie podpisanego certyfikatu...")
        signed_cert_path = CERTS_DIR / username / f"{username}.crt"
        cert_data = run_command(
            f"kubectl get csr {username} -o jsonpath='{{.status.certificate}}'",
            capture_output=True
        )
        with open(signed_cert_path, "wb") as cert_file:
            cert_file.write(base64.b64decode(cert_data))
        print(f"Podpisany certyfikat zapisany: {signed_cert_path}")

        # 7. Generowanie pliku kubeconfig dla użytkownika
        cluster_endpoint = run_command(
            "kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}'",
            capture_output=True
        )
        ca_data = run_command(
            "kubectl config view --minify -o jsonpath='{.clusters[0].cluster.certificate-authority-data}'",
            capture_output=True
        )
        generate_kubeconfig(
            user_name=username,
            key_path=str(key_path),
            cert_path=str(signed_cert_path),
            cluster_name="apt",
            cluster_endpoint=cluster_endpoint,
            ca_data=ca_data
        )
        print(f"Kubeconfig dla użytkownika '{username}' został wygenerowany.")

        # 8. Aplikowanie RoleBinding na klastrze
        print("Aplikowanie RoleBinding na klastrze...")
        apply_to_cluster(role_binding_path)

        print(f"Użytkownik '{username}' został pomyślnie dodany z rolą '{role_type}'.")
    except Exception as e:
        print(f"{e}")
        

if __name__ == "__main__":
    main()
