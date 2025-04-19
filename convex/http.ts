import { httpRouter } from "convex/server"
import { httpAction } from "./_generated/server"
import { Webhook } from "svix"
import { api } from "./_generated/api"

const http = httpRouter()

http.route({
  path: "/clerk-update",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Use uppercase for environment variables
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error("Missing webhook secret")
      return new Response("Missing webhook secret", { status: 500 })
    }

    // Get the headers
    const svix_id = request.headers.get("svix-id")
    const svix_signature = request.headers.get("svix-signature")
    const svix_timestamp = request.headers.get("svix-timestamp")

    if (!svix_id || !svix_signature || !svix_timestamp) {
      console.error("Missing svix headers", { svix_id, svix_signature, svix_timestamp })
      return new Response("Missing svix headers", { status: 400 })
    }

    // Get the body
    const payload = await request.json()
    const body = JSON.stringify(payload)

    // Create a new Webhook instance with the secret
    const wh = new Webhook(webhookSecret)
    let evt: any

    // Verify the webhook
    try {
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-signature": svix_signature,
        "svix-timestamp": svix_timestamp,
      }) as any
    } catch (error) {
      console.error("Error verifying webhook", error)
      return new Response(`Error verifying webhook: ${error instanceof Error ? error.message : String(error)}`, {
        status: 400,
      })
    }

    const eventType = evt.type
    console.log("Webhook event received:", eventType)

    if (eventType === "user.created") {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data

      if (!email_addresses || email_addresses.length === 0) {
        console.error("No email addresses found in webhook data")
        return new Response("No email addresses found", { status: 400 })
      }

      const email = email_addresses[0].email_address
      const name = `${first_name || ""} ${last_name || ""}`.trim()
      const username = email.split("@")[0]

      console.log("Creating user:", { email, name, id, username })

      try {
        const userId = await ctx.runMutation(api.users.createUser, {
          email,
          fullname: name,
          image: image_url,
          clerkId: id,
          username,
        })

        console.log("User created successfully:", userId)
        return new Response(JSON.stringify({ success: true, userId }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      } catch (error) {
        console.error("Error creating user:", error)
        return new Response(`Error creating user: ${error instanceof Error ? error.message : String(error)}`, {
          status: 500,
        })
      }
    }

    return new Response("Webhook processed successfully", { status: 200 })
  }),
})

export default http
