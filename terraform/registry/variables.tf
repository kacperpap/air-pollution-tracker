variable "repository_name" {
  description = "Name of the ECR repository"
  type        = string
  default     = "air-pollution-tracker"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-central-1" 
}