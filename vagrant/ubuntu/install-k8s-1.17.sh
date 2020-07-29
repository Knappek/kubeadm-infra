#!/bin/bash

apt-get update
apt-get install -y kubelet=1.17.9-00 kubectl=1.17.9-00 kubeadm=1.17.9-00
apt-mark hold kubelet kubeadm kubectl