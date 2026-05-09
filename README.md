# 🎬 Prompt Bucket: Director's Suite

**The ultimate AI Video Production Workspace.** Transform raw concepts into detailed, frame-by-frame production blueprints and manage your entire video assets ecosystem in one premium interface.

---

## 🌟 Overview

Prompt Bucket is a professional-grade platform designed for AI cinematographers and video creators. It bridges the gap between raw AI generation and structured video production by providing a "Director's Suite"—a specialized workspace for crafting, refining, and managing complex video narratives.

## 🚀 Key Features

### 🎞️ The Director's Suite
- **Narrative Synthesis**: Generate comprehensive story summaries from simple ideas.
- **Character Identity Anchors**: Establish stable prompt seeds to ensure visual consistency across all frames.
- **Frame-by-Frame Orchestration**: AI-generated scene breakdowns with technical shot types and durations.
- **Interactive Refinement**: Use AI to tweak individual frames or re-sync the entire production to new creative directions.

### 📋 Production Blueprints
- **Technical Breakdown**: View your projects as structured timelines with precise timestamps.
- **Smart Asset Linking**: Add production links (YouTube, Vimeo, Google Drive) directly to individual scenes.
- **Dynamic Previews**: Automatic thumbnail extraction for linked assets—instantly see your production come to life.
- **Version Multiverse**: Full history tracking. Switch between previous versions of your vision with a single click.

### 🏛️ The Library
- **Asset Gallery**: A premium card-based gallery to browse your saved prompts and finished productions.
- **Instant Playback**: Watch final videos directly from your library cards.
- **Deep Integration**: Seamlessly move from a library prompt back into the Director's Suite for further refinement.

## 🛠️ Technology Stack

- **Framework**: [Astro](https://astro.build/) + [React](https://reactjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animation**: [Framer Motion](https://www.framer.com/motion/)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL + Real-time)
- **AI Engine**: Groq (Llama 3) for rapid narrative and frame generation.
- **Icons**: [Lucide React](https://lucide.dev/)

## 🏗️ Database Setup

The project uses a consolidated schema located in `/sql/schema.sql`. To set up your environment:

1. Create a new Supabase project.
2. Run the contents of `sql/schema.sql` in the Supabase SQL Editor.
3. Configure your `.env` file with your Supabase and API credentials.

## 🧞 Commands

| Command | Action |
| :--- | :--- |
| `bun install` | Installs dependencies |
| `bun dev` | Starts local dev server at `localhost:4321` |
| `bun build` | Build your production site to `./dist/` |
| `bun preview` | Preview your build locally |

---

Developed with ❤️ for the next generation of AI Directors.
