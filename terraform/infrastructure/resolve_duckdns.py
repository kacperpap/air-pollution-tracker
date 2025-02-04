import sys
import socket
import urllib.request

hostname = sys.argv[1]
subdomain = sys.argv[2]
token = sys.argv[3]

try:
    addr_info = socket.getaddrinfo(hostname, None)
    ip = addr_info[0][4][0]

    url = f"https://www.duckdns.org/update?domains={subdomain}&token={token}&ip={ip}&clear=false"
    with urllib.request.urlopen(url) as response:
        response_text = response.read().decode('utf-8')

    print("DuckDNS response:", response_text)

except socket.gaierror as e:
    print(f"Failed to resolve given hostname: {hostname} \n {e}")
    sys.exit(1)
except Exception as e:
    print(f"An error occurred: {e}")
    sys.exit(1)
