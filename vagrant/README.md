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

```shell
vagrant up
```

Then you can ssh into the VM with

```shell
vagrant ssh
```

## Cleanup

```shell
vagrant destroy
```
