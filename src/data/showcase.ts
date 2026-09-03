export interface ShowcaseItem {
	name: string;
	href: string;
	stack: string;
	badge?: string;
	desc: string;
}

export const showcase: ShowcaseItem[] = [
	{
		name: "glibc-malloc-expedition",
		href: "https://github.com/aggrawal-ankur/glibc-malloc-expedition",
		stack: "C · GDB",
		badge: "DONE",
		desc: "A systems investigation of the virtual memory allocator in glibc-2.43, approached from first principles. Explored fundamental data structures and concepts including malloc_chunk, bins, malloc_state, and tcache. Followed a source → hypothesis → experiment → verification approach, producing annotated source code, in-depth design notes, and small reproducible experiments, along with a Docker-based environment."
	},

	// {
	// 	name: "Sample Project",
	// 	href: "https://github.com/example/sample",
	// 	stack: "TypeScript · CLI",
	// 	badge: "OSS",
	// 	desc: "A short, plain description of what the project does and why it's interesting. One or two sentences is plenty — keep the prose tight so the row stays scannable.",
	// },
	// {
	// 	name: "Another Thing",
	// 	href: "https://example.com",
	// 	stack: "Web App · Realtime",
	// 	badge: "Live",
	// 	desc: "Use the badge slot for a status hint — installs, stars, version, or just an OSS / Closed marker. Leave the field undefined and the badge disappears.",
	// },
	// {
	// 	name: "Research Note",
	// 	href: "https://github.com/example/paper",
	// 	stack: "Python · Algorithms",
	// 	desc: "Showcase entries don't have to be products — a write-up, a paper repo, a one-off experiment all fit. The list is rendered in order; reorder to taste.",
	// },
];
