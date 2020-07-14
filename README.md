# kubeadm-infra

Provision infrastructure with all [kubeadm](https://kubernetes.io/docs/reference/setup-tools/kubeadm/kubeadm/) requirements already properly configured and installed to easily install Kubernetes clusters using kubeadm.

Kubeadm is a tool built to provide **kubeadm init** and **kubeadm join** as best-practice “fast paths” for creating Kubernetes clusters. By design, it cares only about bootstrapping, not about provisioning machines.

The **kubeadm-infra** project cares about provisioning machines.

## Getting Started

Currently it supports provisioning machines/infrastructure on:

* [Vagrant](./vagrant)
* [GCP](./gcp)

Check out the corresponding README.

## Contributing

I started with this project to prepare for my upcoming CKA exam in order to practice setting up HA clusters with kubeadm, cluster troubleshooting etc. The infrastructure might not follow best practices and, thus, it is not recommended to use in production.

But this could be changed in theory ;).

Open issues and send PRs :).
