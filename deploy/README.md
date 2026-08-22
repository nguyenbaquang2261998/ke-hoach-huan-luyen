# Tapluyen CI/CD

GitHub Actions builds `army-tech` as a Docker image, pushes it to Docker Hub, then deploys it to the VPS with Docker Compose. The Node container binds to `127.0.0.1:3016`; the host Nginx proxies `tapluyen.vmeta.vn` to that local port.

Required GitHub repository secrets:

- `VPS_HOST`
- `VPS_PASSWORD`
- `VPS_PORT`
- `VPS_USER`
- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`

One-time VPS setup:

```bash
sudo apt update
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER"
sudo ufw allow 80/tcp
```

Log out and log back in after adding the user to the Docker group.

Deployment path on the VPS:

```text
~/tapluyen
```

The first deployment creates `~/tapluyen/.env` with a random `AUTH_TOKEN_SECRET` and `DEFAULT_ADMIN_PASSWORD`. Edit that file on the VPS when you need to add `OPENAI_API_KEY` or change production settings.

The app is reached through the existing host Nginx on port `80`; the Docker container itself is only exposed on `127.0.0.1:3016`.

After DNS points to the VPS, open:

```text
http://tapluyen.vmeta.vn
```
