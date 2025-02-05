FROM public.ecr.aws/aws-cli/aws-cli:latest

COPY aws_sync_entrypoint.sh /aws_sync_entrypoint.sh
RUN chmod +x /aws_sync_entrypoint.sh

WORKDIR /app/cypress/videos

ENTRYPOINT ["/aws_sync_entrypoint.sh"]
