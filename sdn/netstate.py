from ryu.base import app_manager
from multiprocessing import Process
# from flask import Flask, request, jsonify, abort    # flask interface merge
# with Cingyu

net_state = [True, True, True, True]
link_health = [None, None, None, None]

class StateManager(app_manager.RyuApp):  # asyncore
    OFP_VERSION = [ofproto_v1_0.OFP_VERSION]

    def __init__(self, *args, **kwargs):
        super(SimpleSwitch, self).__init__(*args, **kwargs)

    
