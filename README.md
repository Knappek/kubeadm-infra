# kubeadm infra

Provision infrastructure with all [kubeadm](https://kubernetes.io/docs/reference/setup-tools/kubeadm/kubeadm/) requirements already properly configured and installed to easily install Kubernetes clusters using kubeadm.

Kubeadm is a tool built to provide kubeadm init and kubeadm join as best-practice “fast paths” for creating Kubernetes clusters. By design, it cares only about bootstrapping, not about provisioning machines. This repository cares about provisioning machines.

## Getting Started

Currently it supports provisioning machines/infrastructure on:

* [Vagrant](./vagrant)
* [GCP](./gcp)

Check out the corresponding README files.

## Contributing

Open issues and send PRs :).
