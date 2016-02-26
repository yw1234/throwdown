import subprocess
import sys

last_record = 0

process = subprocess.Popen("ping 192.168.3.1", shell=True, stdout=subprocess.PIPE)
for c in iter(lambda: process.stdout.readline(), ''):
    
