# kubeadm infra - Vagrant

This vagrant setup provisions a Virtual Machine in VirtualBox that can be used to create a [single control-plane cluster with kubeadm](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/create-cluster-kubeadm/).

## Requirements

* [VirtualBox](https://www.virtualbox.org/wiki/Downloads)
* [Vagrant](https://www.vagrantup.com/docs/installation)

## Setup

This setup includes:

* 1 Node that can be used for both master and worker components
* Docker as CRI

## Usage

Change your directory to [ubuntu](./ubuntu) or [centos7](./centos7). Then execute:

```shell
vagrant up
```

You can ssh into the VM with

```shell
vagrant ssh
```

### Do not use latest Kubernetess version

Sometimes you don't want to install the latest kubernetes version that is available for kubeadm, because you might want to practice upgrading a cluster using kubeadm.

Install Kubernetes version `1.17.0` with:

```shell
K8S_VERSION=1.17 vagrant up
```

### Do not install the kubeadm requirements

Sometimes you don't want to have all requirements already configured in order to use kubeadm, because you might want to practice it:

```shell
PROVISION_INFRA=false vagrant up
```

## Cleanup

```shell
vagrant destroy
```
