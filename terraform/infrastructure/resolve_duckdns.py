import sys
import json
import socket

hostname = sys.argv[1]
subdomain = sys.argv[2]
token = sys.argv[3]

try:
    addr_info = socket.getaddrinfo(hostname, None)
    ip = addr_info[0][4][0]

    response = {"ip": ip}
    print(json.dumps(response))

except socket.gaierror as e:
    print(json.dumps({"error": f"Failed to resolve hostname: {str(e)}"}))
    sys.exit(1)
