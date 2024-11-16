resource "aws_ecr_repository" "app_repository" {
  name                 = var.repository_name
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = false
  }
}

resource "aws_ecr_lifecycle_policy" "main" {
  repository = aws_ecr_repository.app_repository.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 9 images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["frontend-", "backend-", "calc-module-"]
          countType     = "imageCountMoreThan"
          countNumber   = 9
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}
