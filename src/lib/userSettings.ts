import localforage from 'localforage';
import { derived, get, readable, readonly, writable } from 'svelte/store';

interface LastUsedSettings {
	lastUsedPromptId: number;
}

export const lastUsedSettings = writable<LastUsedSettings>({ lastUsedPromptId: 0 });

export const loadLastUsedSettings = async () => {
	const lastUsedSettingsFromIndexedDB =
		await localforage.getItem<LastUsedSettings>('lastUsedSettings');
	console.log('loading last used settings', lastUsedSettingsFromIndexedDB);

	if (!lastUsedSettingsFromIndexedDB) {
		lastUsedSettings.set({ lastUsedPromptId: 0 });
	} else lastUsedSettings.set(lastUsedSettingsFromIndexedDB);
};

export const setLastUsedPromptId = async (newLastUsedPromptId: number) => {
	// update only the lastUsedPromptId and leave the rest intact
	lastUsedSettings.update((settings) => ({ ...settings, lastUsedPromptId: newLastUsedPromptId }));
	await localforage.setItem('lastUsedSettings', get(lastUsedSettings));
};
