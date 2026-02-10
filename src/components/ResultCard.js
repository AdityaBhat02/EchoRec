import { ExternalLink, Music, Youtube } from "lucide-react";
import Image from "next/image";

export default function ResultCard({ result }) {
    if (!result) return null;

    const { title, artist, album, coverArt, youtubeLink } = result;

    return (
        <div className="w-full max-w-md bg-secondary/50 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-500">
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden mb-6 shadow-lg">
                {coverArt ? (
                    <Image
                        src={coverArt}
                        alt={title}
                        fill
                        className="object-cover transition-transform hover:scale-105 duration-500"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted">
                        <Music className="h-20 w-20 text-muted-foreground/50" />
                    </div>
                )}
            </div>

            <div className="space-y-2 mb-6 text-center">
                <h2 className="text-2xl font-bold tracking-tight text-white leading-tight">
                    {title}
                </h2>
                <p className="text-lg text-muted-foreground font-medium">{artist}</p>
                {album && <p className="text-sm text-muted-foreground/60">{album}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
                {youtubeLink && (
                    <a
                        href={youtubeLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 bg-[#FF0000] hover:bg-[#CC0000] text-white text-sm font-semibold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-red-900/20"
                    >
                        <Youtube className="h-5 w-5" />
                        YouTube
                    </a>
                )}

                {/* YouTube Music */}
                <a
                    href={`https://music.youtube.com/search?q=${encodeURIComponent(title + " " + artist)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-[#202020] hover:bg-[#303030] text-white text-sm font-semibold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-gray-900/20"
                >
                    <div className="relative">
                        <Youtube className="h-5 w-5 text-red-500" />
                        <div className="absolute inset-0 bg-red-500/20 blur-sm rounded-full" />
                    </div>
                    YT Music
                </a>

                {/* Spotify */}
                <a
                    href={`https://open.spotify.com/search/${encodeURIComponent(title + " " + artist)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-[#1DB954] hover:bg-[#1ed760] text-white text-sm font-semibold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-green-900/20 col-span-2"
                >
                    <Music className="h-5 w-5" />
                    Spotify
                </a>
            </div>

            {/* Shazam Link */}
            {result.shazamLink && (
                <div className="mt-4 text-center">
                    <a href={result.shazamLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 underline">
                        View on Shazam
                    </a>
                </div>
            )}
        </div>
    );
}
