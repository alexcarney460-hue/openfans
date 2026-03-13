"use client";

import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Send } from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Not functional yet - would send to API
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <SiteHeader />

      <main className="flex-1 pt-14">
        <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Contact Us
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Have a question or need help? We&apos;d love to hear from you.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="name" className="text-sm text-gray-600">
                  Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  className="mt-1.5 border-gray-200 bg-gray-50 focus:border-[#00AFF0]/50 focus:ring-[#00AFF0]/30"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-sm text-gray-600">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="mt-1.5 border-gray-200 bg-gray-50 focus:border-[#00AFF0]/50 focus:ring-[#00AFF0]/30"
                />
              </div>

              <div>
                <Label htmlFor="subject" className="text-sm text-gray-600">
                  Subject
                </Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="How can we help?"
                  required
                  className="mt-1.5 border-gray-200 bg-gray-50 focus:border-[#00AFF0]/50 focus:ring-[#00AFF0]/30"
                />
              </div>

              <div>
                <Label htmlFor="message" className="text-sm text-gray-600">
                  Message
                </Label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us more..."
                  required
                  rows={5}
                  className="mt-1.5 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#00AFF0]/50 focus:ring-2 focus:ring-[#00AFF0]/30 focus:outline-none resize-none"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-[#00AFF0] hover:bg-[#009dd8]"
              >
                <Send className="mr-2 h-4 w-4" />
                Send Message
              </Button>
            </form>
          </div>

          {/* Alternative contact */}
          <div className="mt-8 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
              <Mail className="h-4 w-4" />
              <span>
                Or reach us at{" "}
                <a
                  href="mailto:support@openfans.online"
                  className="text-[#00AFF0] hover:underline"
                >
                  support@openfans.online
                </a>
              </span>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
