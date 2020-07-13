import { Config } from "@pulumi/pulumi";

const config = new Config();

export const prefix = config.get("prefix") || "kubeadm"

// nodeCount is the number of master nodes to provision. Defaults to 3 if unspecified.
export const masterCount = config.getNumber("masterCount") || 3;

// nodeCount is the number of worker nodes to provision. Defaults to 3 if unspecified.
export const nodeCount = config.getNumber("nodeCount") || 3;

export const sshUsername = config.get("sshUsername");
export const sshPublicKey = config.get("sshPublicKey");