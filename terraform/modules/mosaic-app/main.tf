terraform {
  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 2.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

resource "vercel_project" "app" {
  name      = "mosaic-${var.app_name}"
  framework = "nextjs"

  git_repository = {
    type = "github"
    repo = var.github_repo
  }

  root_directory = "apps/${var.app_name}"

  dynamic "environment" {
    for_each = var.environment_variables
    content {
      key    = environment.value.key
      value  = environment.value.value
      target = environment.value.target
    }
  }
}

resource "vercel_project_domain" "app" {
  project_id = vercel_project.app.id
  domain     = var.subdomain == "@" ? var.root_domain : "${var.subdomain}.${var.root_domain}"
}

resource "cloudflare_record" "app" {
  zone_id = var.cloudflare_zone_id
  name    = var.subdomain
  value   = "cname.vercel-dns.com"
  type    = "CNAME"
  proxied = false
}
