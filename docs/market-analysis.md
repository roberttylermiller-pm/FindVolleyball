# Analysis of Existing Inefficient Solutions & Market Gap

> Companion to [PRD.md](PRD.md) — additive market research, not a revision of the locked PRD v1. Also tracked as a [Linear document](https://linear.app/robert-miller/document/findvolleyball-analysis-of-existing-inefficient-solutions-and-market-2b9e5479b35b) for portfolio visibility.

Before building FindVolleyball, it's worth being precise about *why* the current workarounds fail, rather than assuming "no good solution exists." Organizers aren't doing nothing — they're improvising with generic tools, and those improvisations have specific, recurring failure modes. Understanding those failure modes is what shapes the product, not just the absence of a competitor.

## 1. The No-Code Widget Workaround

The most common pattern today: a community organizer builds a shared map using a generic no-code tool — [Proxi](https://map.proxi.co/r/w5Jp5P7Ht_iw3qtNB8F9) is a real example, and shared Google My Maps embeds are just as common. These tools are reasonable zero-cost choices for someone who isn't a developer and just wants *a pin on a map* — that's the appeal, and it's worth taking seriously as the baseline alternative, not dismissing it.

But a tool built for generic point-of-interest mapping (campus tours, retail locations, travel itineraries) inherits none of the structure a recurring-meetup directory needs. It's a list-and-map renderer, not a volleyball-specific data model — which is exactly where the next four problems come from.

## 2. UI/UX & Mobile Friction

These widgets are embedded iframes wrapping someone else's product, not a designed experience. In practice that means: the organizer's branding is whatever logo they could drop into a settings panel, the embed frequently fights the host page's width/scroll behavior, and — most importantly for this use case — the mobile experience is an afterthought. A player standing at a park trying to confirm "is this still happening at 6pm tonight" is on a phone, often on a spotty connection, often already running late. A pinch-zoom map widget designed for desktop browsing is the worst possible interface for that moment. The product surface that matters most (mobile, in-the-moment lookup) is the one these tools handle worst.

## 3. Sport-Specific Filtering Limits

Generic map tools support a marker, a title, and maybe a free-text tag or category color. That's adequate for "here are 12 coffee shops." It breaks down the moment a player needs to filter on more than one volleyball-specific axis at once — e.g. **"Beach" + "Free" + "Open Play" (not a closed league)**. Most no-code tools have no concept of structured, combinable filters at all; at best you get a single category dropdown. The PRD's filter model (Type × Cost × Location, with skill level and public/private as listing-level fields) is precisely the structured data these tools can't represent, because they were never built to model a sport's actual decision criteria — just "where is this thing."

## 4. The SEO Dead-End

This is the gap with the highest leverage and the one generic tools structurally cannot close. A Proxi or Google My Maps URL is a single client-rendered page behind a UUID — there's no per-location URL, no server-rendered content, nothing for a search crawler to index as "grass volleyball in Encino." A player who searches Google for local games will never discover that map; they'd have to already know it exists, via word of mouth or a Facebook group post that's likely buried within days.

This is the direct rationale for the M2.5 programmatic SEO build: every approved listing gets its own static, indexable `/courts/[city]-[neighborhood]-[surface]-[name]` page with contextual title/meta tags. That's not a nice-to-have on top of the map — it's the one capability category that no embedded-widget competitor can replicate without becoming a different kind of product (i.e., becoming FindVolleyball).

## 5. The Data Decay Problem

A shared map has no owner once it's published, and no mechanism, that turns "this game moved to Tuesdays" or "this league folded last spring" into an update. The organizer who made the map has to remember it exists and manually edit it — and most don't, because there's no feedback loop telling them anything changed. The result is what's effectively a "dead map": still online, still ranking in someone's bookmarks, confidently showing a Thursday 7pm run that stopped happening eight months ago. Worse, a stale listing isn't just unhelpful — it actively erodes trust in *whatever else is on the map*, including the listings that are still accurate.

This is the gap [the decay/voting model](https://linear.app/robert-miller/document/play-volleyball-decisions-log-e625f8480dac) is built to close: a visible thumbs-up/down signal, a silent report channel, and a 60-day no-upvote decay flag turn data freshness into something the *userbase* maintains passively, instead of something that depends on one organizer remembering to log back into a tool they set up once and forgot about.

---

## Why this matters for the build

None of these five gaps are solved by "build a nicer-looking map." They're solved by:
- Structured, sport-specific data (→ M1 schema)
- A first-class mobile experience, not an embed (→ M7 mobile pass)
- Combinable filters across volleyball-specific fields (→ M2 filters)
- Indexable, per-listing static pages (→ M2.5 pSEO)
- A crowdsourced freshness signal (→ M6 voting/decay)

Each existing milestone maps directly to one of these failure modes — this analysis is the "why" behind decisions that were otherwise justified on cost/complexity grounds alone.
