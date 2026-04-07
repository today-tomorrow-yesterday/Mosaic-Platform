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
  name                  = "mosaic-${var.app_name}"
  framework             = "nextjs"
  root_directory        = "apps/${var.app_name}"
  ignored_build_command = "npx turbo-ignore --fallback=HEAD^"

  git_repository = {
    type = "github"
    repo = var.github_repo
  }

  # Shared env vars — safe to commit (no secrets)
  # Secret values (NEXT_PUBLIC_CONVEX_URL, Clerk keys, ANTHROPIC_API_KEY)
  # must be set manually in the Vercel dashboard per project.
  environment = [
    {
      key    = "ENABLE_EXPERIMENTAL_COREPACK"
      value  = "1"
      target = ["production", "preview", "development"]
    },
    {
      key    = "NEXT_PUBLIC_CLERK_SIGN_IN_URL"
      value  = "https://${var.root_domain}/sign-in"
      target = ["production"]
    },
    {
      key    = "NEXT_PUBLIC_CLERK_SIGN_UP_URL"
      value  = "https://${var.root_domain}/sign-up"
      target = ["production"]
    },
    {
      key    = "NEXT_PUBLIC_PLATFORM_URL"
      value  = "https://${var.root_domain}"
      target = ["production"]
    },
  ]

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
