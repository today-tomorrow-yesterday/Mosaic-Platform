output "project_id" {
  value = vercel_project.app.id
}

output "url" {
  value = var.subdomain == "@" ? "https://${var.root_domain}" : "https://${var.subdomain}.${var.root_domain}"
}
