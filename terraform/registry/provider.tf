terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Istnieje opcja przechowywania stanu w aws - umożliwia wykonywanie terraforma poprzez github actions
  # backend "s3" {
  #   bucket = "nazwa-twojego-bucket-na-tfstate"
  #   key    = "ecr/terraform.tfstate"
  #   region = "eu-central-1"  # Twój region
  # }
}

provider "aws" {
  region = var.aws_region
}
