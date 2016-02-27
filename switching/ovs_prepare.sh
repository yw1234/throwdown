/sbin/modprobe openvswitch
ovsdb-server --remote=punix:/usr/local/var/run/openvswitch/db.sock \
                 --remote=db:Open_vSwitch,Open_vSwitch,manager_options \
                              --pidfile --detach
ovs-vsctl --no-wait init
ovs-vswitchd --pidfile --detach
