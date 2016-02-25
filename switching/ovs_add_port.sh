ovs-vsctl add-br vBundle
ovs-vsctl add-port vBundle eth3
# ovs-vsctl add-port vBundle eth4
ovs-vsctl add-port vBundle eth5 -- set interface eth5 type=internal
ovs-vsctl set interface eth mac=\"00:00:00:00:00:52\"
