#!/usr/bin/env python
#
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
#

import optparse
from proton import Message
from proton.handlers import MessagingHandler
from proton.reactor import Container

class Timer(object):
    def __init__(self, parent):
        self.parent = parent

    def on_timer_task(self, event):
        self.parent.send(event)


class Send(MessagingHandler):
    def __init__(self, url):
        super(Send, self).__init__()
        self.url = url
        self.value = 0
        self.started = False

    def on_start(self, event):
        self.sender = event.container.create_sender(self.url)

    def on_sendable(self, event):
        if not self.started:
            self.timer = event.reactor.schedule(0.1, Timer(self))
            self.started = True

    def send(self, event):
        self.timer = event.reactor.schedule(0.1, Timer(self))
        self.value += 1
        if self.sender.credit:
            msg = Message(body={'value1':self.value, 'value2':self.value * 2})
            self.sender.send(msg)

try:
    Container(Send("amqp://127.0.0.1/value_updates")).run()
except KeyboardInterrupt: pass
