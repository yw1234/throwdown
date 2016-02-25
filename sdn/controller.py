from ryu.base import app_manager
from ryu.controller import ofp_event
from ryu.controller.handler import MAIN_DISPATCHER, CONFIG_DISPATCHER
from ryu.controller.handler import set_ev_cls
from ryu.ofproto import ofproto_v1_0
from ryu.lib.packet import packet
from ryu.lib.packet import ethernet
from ryu.lib.packet import arp
from ryu.lib.packet import ether_types


class SimpleSwitch(app_manager.RyuApp):
    OFP_VERSIONS = [ofproto_v1_0.OFP_VERSION]

    def __init__(self, *args, **kwargs):
        super(SimpleSwitch, self).__init__(*args, **kwargs)
        self.arptable = {}
        self.arptable["192.168.5.1"] = "00:00:00:00:00:51"
        self.arptable["192.168.5.2"] = "00:00:00:00:00:52"
        self.arptable["192.168.3.1"] = "00:50:56:8d:6b:80"
        self.arptable["192.168.3.2"] = "00:50:56:8d:27:5e"
        self.arptable["192.168.4.1"] = "00:50:56:8d:2e:7c"
        self.arptable["192.168.4.2"] = "00:50:56:8d:df:4f"

        self.datapaths = {}

        self.flowpath = []
        flowpath.append(["192.168.3.1", "192.168.3.2"])
        flowpath.append(["192.168.4.1", "192.168.4.2"])

    def add_flow(self, datapath, match, actions):
        ofproto = datapath.ofproto
        mod = datapath.ofproto_parser.OFPFlowMod(
            datapath=datapath, match=match, cookie=0,
            command=ofproto.OFPFC_ADD, idle_timeout=0, hard_timeout=0,
            priority=ofproto.OFP_DEFAULT_PRIORITY,
            flags=ofproto.OFPFF_SEND_FLOW_REM, actions=actions)
        datapath.send_msg(mod)

    def add_flow_path(self, proto, wPort, ePort, lsp_id):
        # handle west
        datapath = datapaths[82]
        match = datapath.ofproto_parser.OFPMatch(dl_type=ether_types.ETH_TYPE_IP,
                                                 proto, tp_src=wPort,
                                                 tp_dst=ePort, in_port=2)
        actions = [parser.OFPActionSetNwSrc(self.flowpath[lsp_id]),
                   parser.OFPActionSetDlSrc(self.arptable["192.168.5.1"]),
                   parser.OFPActionSetNwDst("192.168.5.2"),
                   parser.OFPActionSetDlDst(self.arptable["192.168.5.2"]),
                   parser.OFPActionOutput(2)]
        self.add_flow(datapath, match, actions)
        # handle east

    @set_ev_cls(ofp_event.EventOFPSwitchFeatures, CONFIG_DISPATCHER)
    def switch_features_handler(self, ev):
        msg = ev.msg
        datapath = msg.datapath
        ofproto = datapath.ofproto
        parser = datapath.ofproto_parser
        dpid = datapath.id
        actions = [datapath.ofproto_parser.OFPActionOutput(ofproto.OFPP_CONTROLLER)]
        # match = datapath.ofproto_parser.OFPMatch(dl_type=ether_types.ETH_TYPE_ARP)
        match = datapath.ofproto_parser.OFPMatch()
        # default fwd everything
        self.add_flow(datapath, match, actions)

        if dpid == 82 or dpid == 81:
            self.datapaths[dpid] = dapapath
        # test
        print datapath.id
        if dpid == 82:  # west switch
            # outbound
            match = datapath.ofproto_parser.OFPMatch(dl_type=ether_types.ETH_TYPE_IP,
                                                     in_port=2)
            actions = [parser.OFPActionSetNwSrc("192.168.3.2"),
                       parser.OFPActionSetDlSrc(self.arptable["192.168.3.2"]),
                       parser.OFPActionSetNwDst("192.168.3.1"),
                       parser.OFPActionSetDlDst(self.arptable["192.168.3.1"]),
                       parser.OFPActionOutput(1)]
            self.add_flow(datapath, match, actions)

            # inbound
            match = datapath.ofproto_parser.OFPMatch(dl_type=ether_types.ETH_TYPE_IP,
                                                     in_port=1)
            actions = [parser.OFPActionSetNwSrc("192.168.5.1"),
                       parser.OFPActionSetDlSrc(self.arptable["192.168.5.1"]),
                       parser.OFPActionSetNwDst("192.168.5.2"),
                       parser.OFPActionSetDlDst(self.arptable["192.168.5.2"]),
                       parser.OFPActionOutput(2)]
            self.add_flow(datapath, match, actions)

        if dpid == 81:  # east switch
            # outbound
            match = datapath.ofproto_parser.OFPMatch(dl_type=ether_types.ETH_TYPE_IP,
                                                     in_port=2)
            actions = [parser.OFPActionSetNwSrc("192.168.3.1"),
                       parser.OFPActionSetDlSrc(self.arptable["192.168.3.1"]),
                       parser.OFPActionSetNwDst("192.168.3.2"),
                       parser.OFPActionSetDlDst(self.arptable["192.168.3.2"]),
                       parser.OFPActionOutput(1)]
            self.add_flow(datapath, match, actions)

            # inbound
            match = datapath.ofproto_parser.OFPMatch(dl_type=ether_types.ETH_TYPE_IP,
                                                     in_port=1)
            actions = [parser.OFPActionSetNwSrc("192.168.5.2"),
                       parser.OFPActionSetDlSrc(self.arptable["192.168.5.2"]),
                       parser.OFPActionSetNwDst("192.168.5.1"),
                       parser.OFPActionSetDlDst(self.arptable["192.168.5.1"]),
                       parser.OFPActionOutput(2)]
            self.add_flow(datapath, match, actions)

    @set_ev_cls(ofp_event.EventOFPPacketIn, MAIN_DISPATCHER)
    def _packet_in_handler(self, ev):
        msg = ev.msg
        datapath = msg.datapath
        ofproto = datapath.ofproto

        pkt = packet.Packet(msg.data)
        eth = pkt.get_protocol(ethernet.ethernet)
        pkt_arp = pkt.get_protocol(arp.arp)
        in_port = msg.in_port

        if eth.ethertype == ether_types.ETH_TYPE_LLDP:
            # ignore lldp packet
            return

        if eth.ethertype == ether_types.ETH_TYPE_ARP:
            self._handle_arp(datapath, in_port, eth, pkt_arp)

    def _handle_arp(self, datapath, port, eth, pkt_arp):
        ofproto = datapath.ofproto
        parser = datapath.ofproto_parser

        if pkt_arp.opcode != arp.ARP_REQUEST:
            return
        pkt = packet.Packet()

        if pkt_arp.dst_ip in self.arptable:
           fin_src_mac = self.arptable[pkt_arp.dst_ip]

        pkt.add_protocol(ethernet.ethernet(ethertype=eth.ethertype, dst=eth.src,
                                           src=fin_src_mac))
        pkt.add_protocol(arp.arp(opcode=arp.ARP_REPLY,
                                 src_mac=fin_src_mac, src_ip=pkt_arp.dst_ip,
                                 dst_mac=eth.src, dst_ip=pkt_arp.src_ip))
        pkt.serialize()
        data = pkt.data
        actions = [parser.OFPActionOutput(port=port)]
        self.logger.info("packet out for arp reply %s" %(pkt,))

        out = parser.OFPPacketOut( datapath=datapath,
                                   buffer_id=ofproto.OFP_NO_BUFFER,
                                   in_port = ofproto.OFPP_CONTROLLER,
                                   actions=actions, data=data)
        datapath.send_msg(out)
