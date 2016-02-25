import subprocess
import sys

process = subprocess.Popen("ping 192.168.5.1", shell=True, stdout=subprocess.PIPE)
for c in iter(lambda: process.stdout.readline(), ''):
    print c
