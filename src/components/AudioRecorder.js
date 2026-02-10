"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { clsx } from "clsx";

export default function AudioRecorder({ onAudioCaptured, isAnalyzing, onRecordingStateChange }) {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);

    // Ref to track recording state avoiding stale closures in intervals
    const isRecordingRef = useRef(false);

    const audioContextRef = useRef(null);
    const mediaStreamRef = useRef(null);
    const processorRef = useRef(null);
    const analyserRef = useRef(null);
    const canvasRef = useRef(null);
    const animationFrameRef = useRef(null);

    const audioDataRef = useRef([]);
    const startTimeRef = useRef(null);
    const timerIntervalRef = useRef(null);

    // Notify parent of state changes for dynamic themes
    useEffect(() => {
        if (onRecordingStateChange) {
            onRecordingStateChange(isRecording);
        }
    }, [isRecording, onRecordingStateChange]);

    const startRecording = async () => {
        try {
            if (isRecordingRef.current) return;

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 44100,
                    channelCount: 1,
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                },
            });

            mediaStreamRef.current = stream;
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: 44100,
            });

            if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
            }

            const source = audioContextRef.current.createMediaStreamSource(stream);
            const analyser = audioContextRef.current.createAnalyser();
            analyser.fftSize = 256;
            analyserRef.current = analyser;

            const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);

            const gainNode = audioContextRef.current.createGain();
            gainNode.gain.value = 0; // Mute feedback

            processorRef.current = processor;
            audioDataRef.current = [];

            processor.onaudioprocess = (e) => {
                if (!isRecordingRef.current) return;
                const inputData = e.inputBuffer.getChannelData(0);
                audioDataRef.current.push(new Float32Array(inputData));
            };

            source.connect(analyser);
            analyser.connect(processor);
            processor.connect(gainNode);
            gainNode.connect(audioContextRef.current.destination);

            isRecordingRef.current = true;
            setIsRecording(true);
            startTimeRef.current = Date.now();
            setRecordingTime(0);

            // Start Visualizer
            drawVisualizer();

            // Clear any existing interval just in case
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

            timerIntervalRef.current = setInterval(() => {
                setRecordingTime((prev) => {
                    const time = prev + 1;
                    if (time >= 6) {
                        stopInternal();
                    }
                    return time;
                });
            }, 1000);

        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert(`Microphone Error: ${err.message}`);
        }
    };

    const drawVisualizer = () => {
        if (!analyserRef.current || !canvasRef.current) return;

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const width = canvas.width;
        const height = canvas.height;

        const draw = () => {
            if (!isRecordingRef.current) return;

            animationFrameRef.current = requestAnimationFrame(draw);
            analyserRef.current.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, width, height);

            const centerX = width / 2;
            const centerY = height / 2;
            const radius = 35; // Match button size slightly larger

            ctx.beginPath();
            for (let i = 0; i < bufferLength; i++) {
                const barHeight = dataArray[i] / 2.5;
                const angle = (i * 2 * Math.PI) / bufferLength;
                const x = centerX + (radius + barHeight) * Math.cos(angle);
                const y = centerY + (radius + barHeight) * Math.sin(angle);

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();
            ctx.strokeStyle = "rgba(255, 100, 100, 0.8)"; // Reddish for recording
            ctx.lineWidth = 2;
            ctx.stroke();

            // Dynamic Glow
            const gradient = ctx.createRadialGradient(centerX, centerY, radius, centerX, centerY, radius + 60);
            gradient.addColorStop(0, "rgba(255, 50, 50, 0.3)");
            gradient.addColorStop(1, "rgba(255, 50, 50, 0)");
            ctx.fillStyle = gradient;
            ctx.fill();
        };

        draw();
    };

    const stopInternal = () => {
        if (!isRecordingRef.current) return;

        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }

        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }

        const duration = Date.now() - startTimeRef.current;

        if (duration < 1000) {
            console.warn("Recording too short:", duration);
        }

        isRecordingRef.current = false;
        setIsRecording(false);

        exportWav();
        cleanup();
    };

    const stopRecording = () => {
        stopInternal();
    };

    const cleanup = () => {
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }

        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }

        if (processorRef.current) {
            try {
                processorRef.current.disconnect();
                processorRef.current.onaudioprocess = null;
            } catch (e) { console.error("Cleanup error (processor):", e); }
            processorRef.current = null;
        }

        if (analyserRef.current) {
            try { analyserRef.current.disconnect(); } catch (e) { }
            analyserRef.current = null;
        }

        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }

        if (audioContextRef.current) {
            if (audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close().catch(console.error);
            }
            audioContextRef.current = null;
        }
    };

    const exportWav = () => {
        if (!audioDataRef.current || audioDataRef.current.length === 0) {
            console.error("No audio data to export");
            return;
        }

        try {
            const buffer = mergeBuffers(audioDataRef.current);
            const wavBlob = encodeWAV(buffer, 44100);
            console.log("Exporting WAV Blob:", wavBlob.size);

            setTimeout(() => {
                onAudioCaptured(wavBlob);
            }, 0);

        } catch (e) {
            console.error("Error exporting WAV:", e);
            alert("Error processing audio.");
        }
    };

    const mergeBuffers = (buffers) => {
        let recorderLength = 0;
        for (let i = 0; i < buffers.length; i++) {
            recorderLength += buffers[i].length;
        }
        const result = new Float32Array(recorderLength);
        let offset = 0;
        for (let i = 0; i < buffers.length; i++) {
            result.set(buffers[i], offset);
            offset += buffers[i].length;
        }
        return result;
    };

    const encodeWAV = (samples, sampleRate) => {
        const buffer = new ArrayBuffer(44 + samples.length * 2);
        const view = new DataView(buffer);

        writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + samples.length * 2, true);
        writeString(view, 8, 'WAVE');
        writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true); // PCM format
        view.setUint16(22, 1, true); // Mono
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(view, 36, 'data');
        view.setUint32(40, samples.length * 2, true);

        floatTo16BitPCM(view, 44, samples);

        return new Blob([view], { type: 'audio/wav' });
    };

    const floatTo16BitPCM = (output, offset, input) => {
        for (let i = 0; i < input.length; i++, offset += 2) {
            const s = Math.max(-1, Math.min(1, input[i]));
            output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }
    };

    const writeString = (view, offset, string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanup();
        };
    }, []);

    return (
        <div className="flex flex-col items-center justify-center p-6 space-y-6 relative">
            <div
                className={clsx(
                    "relative w-64 h-64 flex items-center justify-center transition-all duration-300",
                    // Remove static borders/backgrounds if recording since canvas will handle visuals
                    !isRecording && "rounded-full bg-purple-600/10 border-4 border-purple-500/30"
                )}
            >
                {isRecording && (
                    <canvas
                        ref={canvasRef}
                        width={256}
                        height={256}
                        className="absolute inset-0 z-0 pointer-events-none"
                    />
                )}

                <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isAnalyzing}
                    className={clsx(
                        "z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-200 shadow-xl",
                        isRecording
                            ? "bg-red-500 hover:bg-red-600 shadow-red-500/50 scale-100"
                            : "bg-purple-600 hover:bg-purple-700 shadow-purple-600/50 hover:scale-105",
                        isAnalyzing && "opacity-50 cursor-not-allowed"
                    )}
                >
                    {isAnalyzing ? (
                        <Loader2 className="w-10 h-10 text-white animate-spin" />
                    ) : isRecording ? (
                        <Square className="w-8 h-8 text-white fill-current" />
                    ) : (
                        <Mic className="w-10 h-10 text-white" />
                    )}
                </button>
            </div>

            <div className="text-center space-y-2 relative z-10">
                <h2 className="text-2xl font-bold tracking-tight">
                    {isAnalyzing
                        ? "Identifying Song..."
                        : isRecording
                            ? "Listening..."
                            : "Tap to Listen"}
                </h2>
                <p className="text-white/60 text-sm font-medium">
                    {isRecording
                        ? `Listening... (Auto-search in ${6 - recordingTime}s)`
                        : "Tap to Listen (Auto-detects in 6s)"}
                </p>
            </div>
        </div>
    );
}
