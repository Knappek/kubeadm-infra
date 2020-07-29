#!/bin/bash

# version 1.17.0, good if you want to upgrade your cluster with kubeadm
yum install -y kubelet-1.17.0 kubeadm-1.17.0 kubectl-1.17.0 --disableexcludes=kubernetes 