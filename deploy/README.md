# Tapluyen CI/CD

GitHub Actions builds `army-tech` as a Docker image, pushes it to Docker Hub, then deploys it to the VPS with Docker Compose. The Node container binds to `127.0.0.1:3016`; the host Nginx proxies `khhl.vmeta.vn` to that local port.
TEST CICD
Required GitHub repository secrets:

- `VPS_HOST`: Địa chỉ IP hoặc domain của VPS
- `VPS_PORT`: Cổng SSH (thường là `22`)
- `VPS_USER`: Tên tài khoản SSH (ví dụ: `root` hoặc `ubuntu`)
- `VPS_SSH_KEY` **(Khuyên dùng)**: Nội dung Private Key SSH để đăng nhập VPS không cần mật khẩu.
  *Hoặc* `VPS_PASSWORD`: Mật khẩu tài khoản VPS (yêu cầu VPS phải bật `PasswordAuthentication yes`).
- `DOCKERHUB_USERNAME`: Tên tài khoản Docker Hub
- `DOCKERHUB_TOKEN`: Personal Access Token của Docker Hub

> **Lưu ý lỗi `Permission denied (publickey)`**:
> - Nếu gặp lỗi này, máy chủ VPS của bạn đang tắt xác thực mật khẩu.
> - **Cách 1 (Khuyên dùng)**: Thêm private key vào secret `VPS_SSH_KEY`, đồng thời đảm bảo public key tương ứng đã nằm trong `~/.ssh/authorized_keys` trên VPS.
> - **Cách 2**: SSH vào VPS và bật mật khẩu bằng cách sửa `/etc/ssh/sshd_config` (hoặc `/etc/ssh/sshd_config.d/*.conf`): chuyển `PasswordAuthentication yes`, sau đó chạy `sudo systemctl restart sshd`.

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

The Docker Compose project is intentionally still named `tapluyen`; this keeps the production SQLite data in the existing Docker volume `tapluyen_app_data`. The app stores its runtime database at `/app/data/exam-draw.db` inside the container, backed by that VPS volume.

The first deployment creates `~/tapluyen/.env` with a random `AUTH_TOKEN_SECRET` and `DEFAULT_ADMIN_PASSWORD`. Edit that file on the VPS when you need to add `OPENAI_API_KEY`, rotate the admin password, or change production settings.

The app is reached through the existing host Nginx on port `80`; the Docker container itself is only exposed on `127.0.0.1:3016`.

After DNS points to the VPS, open:

```text
https://khhl.vmeta.vn
```
