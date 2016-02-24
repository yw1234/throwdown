import requests
requests.packages.urllib3.disable_warnings()
import json

url = "https://10.10.2.25:8443/oauth2/token"
payload = {'grant_type': 'password', 'username': 'group8', 'password':
           'nyu2016'}
response = requests.post (url, data=payload, auth=('group8','nyu2016'), verify=False)
json_data = json.loads(response.text)
authHeader= {"Authorization":"{token_type} {access_token}".format(**json_data)}

r = requests.get('https://10.10.2.25:8443/NorthStar/API/v1/tenant/1/topology/1/te-lsps/', headers=authHeader, verify=False)

p = json.dumps(r.json())
lsp_list = json.loads(p)

for lsp in lsp_list:
        if lsp['name'] == 'GROUP_EIGHT_SF_NY_LSP3':
            break

new_lsp = {}
new_lsp['from'] = lsp['from']
new_lsp['to'] = lsp['to']
new_lsp['name'] = lsp['name']
new_lsp['lspIndex'] = lsp['lspIndex']
new_lsp['pathType'] = lsp['pathType']
new_lsp['plannedProperties'] = {}
new_lsp['plannedProperties']['ero'] = [
        { 'topoObjectType': 'ipv4', 'address': "10.210.18.2"},
        { 'topoObjectType': 'ipv4', 'address': "10.210.19.1"},
        { 'topoObjectType': 'ipv4', 'address': "10.210.21.2"},
        { 'topoObjectType': 'ipv4', 'address': "10.210.22.1"},
        { 'topoObjectType': 'ipv4', 'address': "10.210.12.2"}
    ]

response = requests.put('https://10.10.2.25:8443/NorthStar/API/v1/tenant/1/topology/1/te-lsps/'
             + str(new_lsp['lspIndex']), json = new_lsp, headers=authHeader,
             verify=False)

print response.text
