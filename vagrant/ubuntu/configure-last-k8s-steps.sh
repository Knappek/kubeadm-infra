#!/bin/bash

systemctl daemon-reload
systemctl restart kubelet
kubeadm config images pull

apt-get install etcd-client -y

# disable swap
swapoff -a