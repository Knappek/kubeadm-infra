import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import { prefix, nodeCount, masterCount, sshUsername, sshPublicKey } from "./config";
import { SshPublicKey } from "@pulumi/gcp/oslogin";

const clusterCidr = "10.200.0.0/16"
const masterNodePrefix = `${prefix}-k8s-controller`
const workerNodePrefix = `${prefix}-k8s-worker`

// Create a GCP resource (Storage Bucket)
const vpcNetwork = new gcp.compute.Network(`${prefix}-infra`, {
    autoCreateSubnetworks: false,
});

const subnet = new gcp.compute.Subnetwork(`${prefix}-subnet`, {
    ipCidrRange: "10.240.0.0/24",
    region: gcp.config.region,
    network: vpcNetwork.id,
});

const publicIpLB = new gcp.compute.Address(`${prefix}-lb-public-ip`, {
    region: gcp.config.region,
});

const kubernetesHttpHealthCheck = new gcp.compute.HttpHealthCheck(`${prefix}-k8s-health-check`, {
    description: "Kubernetes Health Check",
    host: "kubernetes.default.svc.cluster.local",
    requestPath: "/healthz",
});

const firewallAllowAllInternal = new gcp.compute.Firewall(`${prefix}-allow-all-internal`, {
    network: vpcNetwork.selfLink,
    allows: [{
        protocol: "tcp",
    }, {
        protocol: "udp",
    }, {
        protocol: "icmp",
    }],
    sourceRanges: [subnet.ipCidrRange, clusterCidr]
})

const firewallAllowAllExternal = new gcp.compute.Firewall(`${prefix}-allow-all-external`, {
    network: vpcNetwork.selfLink,
    allows: [{
        protocol: "tcp",
        ports: ["22", "6443", "80"]
    }, {
        protocol: "icmp",
    }],
    sourceRanges: ["0.0.0.0/0"]
})

// let controlplaneEndpoint: pulumi.Output<string> = pulumi.concat(publicIpLB.address, ":6443");
// let controlplaneEndpoint: pulumi.Output<string> = publicIpLB.address.apply(ip => `${ip}:6443`)
let startupScript = publicIpLB.address.apply(ip => `#!/bin/bash
sudo modprobe overlay
sudo modprobe br_netfilter

# Setup required sysctl params, these persist across reboots.
cat <<EOF | sudo tee /etc/sysctl.d/99-kubernetes-cri.conf
net.bridge.bridge-nf-call-iptables  = 1
net.ipv4.ip_forward                 = 1
net.bridge.bridge-nf-call-ip6tables = 1
EOF
sudo sysctl --system

# install docker
sudo apt-get update
sudo apt  install docker.io -y
sudo systemctl start docker && sudo systemctl enable docker.service
sudo groupadd docker -f && sudo usermod -aG docker ${sshUsername} && sudo chown root:docker /var/run/docker.sock

# install kubelet, kubectl and kubeadm
sudo apt-get install -y apt-transport-https curl
curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -
cat <<EOF | sudo tee /etc/apt/sources.list.d/kubernetes.list
deb https://apt.kubernetes.io/ kubernetes-xenial main
EOF
sudo apt-get update
sudo apt-get install -y kubelet kubeadm kubectl
sudo apt-mark hold kubelet kubeadm kubectl
sudo kubeadm config images pull



cat <<EOF | sudo tee /etc/kubernetes/cloud-config
[Global]
project-id = ${gcp.config.project}
EOF

sudo systemctl daemon-reload
sudo systemctl restart kubelet

# enable HTTP Health Checks
sudo apt-get install -y nginx
cat <<EOF | sudo tee /etc/nginx/sites-available/kubernetes.default.svc.cluster.local
server {
  listen      80;
  server_name kubernetes.default.svc.cluster.local;

  location /healthz {
     proxy_pass                    https://127.0.0.1:6443/healthz;
     proxy_ssl_trusted_certificate /var/lib/kubernetes/ca.pem;
  }
}
EOF
sudo ln -s /etc/nginx/sites-available/kubernetes.default.svc.cluster.local /etc/nginx/sites-enabled/
sudo systemctl restart nginx
sudo systemctl enable nginx
`);

let masterInstances = []
for (let i = 0; i < masterCount; i++) {
    masterInstances.push(new gcp.compute.Instance(`${masterNodePrefix}-${i}`, {
        machineType: "n1-standard-2",
        metadataStartupScript: startupScript,
        bootDisk: {
            initializeParams: {
                image: "ubuntu-os-cloud/ubuntu-1804-lts",
                size: 20,
            },
        },
        metadata: {
            "cluster-cidr": clusterCidr,
            "k8s-public-ip": publicIpLB.address,
            "ssh-keys": `${sshUsername}: ${sshPublicKey}`
        },
        networkInterfaces: [{
            accessConfigs: [{}],
            network: vpcNetwork.id,
            // networkIp: `10.240.0.1${i}`,
            subnetwork: subnet.name,
        }],
        serviceAccount: {
            scopes: [
                "https://www.googleapis.com/auth/cloud-platform",
                "https://www.googleapis.com/auth/compute",
                "https://www.googleapis.com/auth/devstorage.read_only",
                "https://www.googleapis.com/auth/service.management.readonly",
                "https://www.googleapis.com/auth/servicecontrol",
                "https://www.googleapis.com/auth/logging.write",
                "https://www.googleapis.com/auth/monitoring",
            ],
        },
        tags: [
            `${prefix}`,
            "controller",
            `k8s-controller-${i}`,
        ]
    }))
}
let targetPoolInstances: pulumi.Output<string>[] = []
masterInstances.forEach(instance=>targetPoolInstances.push(instance.selfLink))
const kubernetesTargetPool = new gcp.compute.TargetPool(`${prefix}-k8s-target-pool`, {
    healthChecks: kubernetesHttpHealthCheck.name,
    instances: targetPoolInstances,
    region: gcp.config.region,
});

const kubernetesForwardingRule = new gcp.compute.ForwardingRule(`${prefix}-forwarding-rule`, {
    target: kubernetesTargetPool.id,
    portRange: "6443",
    ipAddress: publicIpLB.address,
    region: gcp.config.region,
});

for (var i = 0; i < nodeCount; i++) {
    new gcp.compute.Instance(`${workerNodePrefix}-${i}`, {
        machineType: "n1-standard-1",
        metadataStartupScript: startupScript,
        bootDisk: {
            initializeParams: {
                image: "ubuntu-os-cloud/ubuntu-1804-lts",
                size: 20, 
            },
        },
        canIpForward: true,
        metadata: {
            "pod-cidr": `10.200.${i}.0/24`,
            "ssh-keys": `${sshUsername}: ${sshPublicKey}`
        },
        networkInterfaces: [{
            accessConfigs: [{}],
            network: vpcNetwork.id,
            // networkIp: `10.240.0.2${i}`,
            subnetwork: subnet.name,
        }],
        serviceAccount: {
            scopes: [
                "https://www.googleapis.com/auth/cloud-platform",
                "https://www.googleapis.com/auth/compute",
                "https://www.googleapis.com/auth/devstorage.read_only",
                "https://www.googleapis.com/auth/service.management.readonly",
                "https://www.googleapis.com/auth/servicecontrol",
                "https://www.googleapis.com/auth/logging.write",
                "https://www.googleapis.com/auth/monitoring",
            ],
        },
        tags: [
            `${prefix}`,
            "worker",
            `k8s-worker-${i}`,
        ]
    })
}
