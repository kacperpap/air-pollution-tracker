variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-central-1"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "air-pollution-tracker"
}

variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
  default     = "apt-cluster"
}
