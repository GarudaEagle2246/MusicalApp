import { unknownTrackImageUri } from '@/constants/images'
import { Artist, Playlist, TrackWithPlaylist } from '@/helpers/types'
import { arrayRemove, arrayUnion, collection, doc, getDocs, updateDoc } from 'firebase/firestore'
import { db } from 'firebaseConfig'
import { create } from 'zustand'

// Zustand Store
interface LibraryState {
	tracks: TrackWithPlaylist[]
	fetchTracks: () => Promise<void>
	toggleTrackFavorite: (track: TrackWithPlaylist) => void
	addToPlaylist: (track: TrackWithPlaylist, playlistName: string) => void
	removeFromPlaylist: (track: TrackWithPlaylist, playlistName: string) => void
}

export const useLibraryStore = create<LibraryState>()((set) => ({
	tracks: [],

	// Fetch tracks from Firestore
	fetchTracks: async () => {
		try {
			const querySnapshot = await getDocs(collection(db, 'tracks'))
			const tracksData: TrackWithPlaylist[] = querySnapshot.docs.map((doc) => {
				const data = doc.data()

				// Map Firestore data to TrackWithPlaylist type
				const trackWithPlaylist: TrackWithPlaylist = {
					id: doc.id, // Firestore document ID as track ID
					title: data.title, // Track title
					url: data.url, // Audio URL
					artist: data.artist, // Artist name
					artwork: data.artwork, // Track artwork
					playlist: data.playlist, // Playlist array
					rating: data.rating, // Rating
				}

				return trackWithPlaylist
			})

			set({ tracks: tracksData })
		} catch (error) {
			console.error('Error fetching tracks from Firestore:', error)
		}
	},

	// Toggle favorite status
	toggleTrackFavorite: async (track: TrackWithPlaylist) => {
		const newRating = track.rating === 1 ? 0 : 1

		// Update Firestore
		const trackRef = doc(db, 'tracks', track.id)
		await updateDoc(trackRef, { rating: newRating })

		// Update local state
		set((state) => ({
			tracks: state.tracks.map((currentTrack) =>
				currentTrack.id === track.id ? { ...currentTrack, rating: newRating } : currentTrack,
			),
		}))
	},

	// Add a track to a playlist
	addToPlaylist: async (track: TrackWithPlaylist, playlistName: string) => {
		const updatedPlaylist = [...(track.playlist ?? []), playlistName]

		// Update Firestore
		const trackRef = doc(db, 'tracks', track.id)
		await updateDoc(trackRef, { playlist: arrayUnion(playlistName) })

		// Update local state
		set((state) => ({
			tracks: state.tracks.map((currentTrack) =>
				currentTrack.id === track.id
					? { ...currentTrack, playlist: updatedPlaylist }
					: currentTrack,
			),
		}))
	},

	// Remove a track from a playlist
	removeFromPlaylist: async (track: TrackWithPlaylist, playlistName: string) => {
		const updatedPlaylist = track.playlist?.filter((name) => name !== playlistName) ?? []

		const trackRef = doc(db, 'tracks', track.id)
		await updateDoc(trackRef, { playlist: arrayRemove(playlistName) }) // Firebase update

		set((state) => ({
			tracks: state.tracks.map((currentTrack) =>
				currentTrack.id === track.id
					? { ...currentTrack, playlist: updatedPlaylist }
					: currentTrack,
			),
		}))
	},
}))

// Custom hook to get all tracks
export const useTracks = () => {
	const tracks = useLibraryStore((state) => state.tracks)
	const fetchTracks = useLibraryStore((state) => state.fetchTracks)

	return { tracks, fetchTracks }
}

// Custom hook to get favorite tracks
export const useFavorites = () => {
	const favorites = useLibraryStore((state) => state.tracks.filter((track) => track.rating === 1))
	const toggleTrackFavorite = useLibraryStore((state) => state.toggleTrackFavorite)

	return {
		favorites,
		toggleTrackFavorite,
	}
}

export const useArtists = () =>
	useLibraryStore((state) => {
		return state.tracks.reduce((acc, track) => {
			const existingArtist = acc.find((artist) => artist.name === track.artist)

			if (existingArtist) {
				existingArtist.tracks.push(track)
			} else {
				acc.push({
					name: track.artist ?? 'Unknown',
					tracks: [track],
				})
			}

			return acc
		}, [] as Artist[])
	})

// Custom hook to get playlists from tracks
export const usePlaylists = () => {
	const playlists = useLibraryStore((state) => {
		// Create playlist array from tracks with their playlist field
		return state.tracks.reduce((acc, track) => {
			track.playlist?.forEach((playlistName) => {
				const existingPlaylist = acc.find((playlist) => playlist.name === playlistName)

				if (existingPlaylist) {
					existingPlaylist.tracks.push(track)
				} else {
					acc.push({
						name: playlistName,
						tracks: [track],
						artworkPreview: track.artwork ?? unknownTrackImageUri,
					})
				}
			})

			return acc
		}, [] as Playlist[])
	})

	const addToPlaylist = useLibraryStore((state) => state.addToPlaylist)
	const removeFromPlaylist = useLibraryStore((state) => state.removeFromPlaylist)

	return { playlists, addToPlaylist, removeFromPlaylist }
}
