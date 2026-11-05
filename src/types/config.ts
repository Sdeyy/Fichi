/**
 * Shapes of the YAML configuration files under `data/settings`.
 * They mirror the files 1:1 so every access is checked by the compiler.
 */

export interface DiscordConfig {
	BOT_CONFIG: {
		NAME: string;
		EMBED_COLOR: string;
		TOKEN: string;
		GUILD_ID: string;
		BOT_ID: string;
		MONGO_URI: string;
	};
	TICKET: {
		ONE_BUTTON_TICKETS: boolean;
		TICKET_LIMIT: boolean;
		REASON_ENABLED: boolean;
		LOGS_SYSTEM: boolean;
		CLOSE_ONLY_SUPPORT: boolean;
		'SERVER-NAME': string;
		LOGS_CHANNEL: string;
		TRANSCRIPT_CHANNEL: string;
		SUPPORT_ROLE: string;
		ADMIN_ROLE: string;
	};
	BALL: {
		CONFIG: string[];
	};
	DISABLE_COMMANDS: {
		DISABLED: string[];
	};
	INVITES: {
		ENABLED: boolean;
		CHANNEL: string;
		MESSAGE: string;
	};
	REACTION_ROLES: {
		ENABLED: boolean;
		EMBED_CONFIG: {
			TITLE: string;
			DESCRIPTION: string;
			FOOTER: string;
			COLOR: string;
		};
	};
	ECONOMY: {
		ENABLED: boolean;
		WORKS: string[];
		WORK_COOLDOWN: string;
		STOLEN_MIN_MONEY: number;
		SLOT_EMOJIS: string[];
		COLLECT_ROLES?: Record<string, number>;
	};
}

export interface EmbedGroup {
	Title: string;
	Description: string;
	Footer: string;
	Color: string;
	Timestamp?: boolean;
	Banner?: string;
	Thumbnail?: string;
	messagePanel?: string;
	Ephemeral?: boolean;
}

export interface Embeds {
	Cooldown: {
		Message: string;
		Ephemeral: boolean;
	};
	Invites: {
		Leaderboard: EmbedGroup;
		AddInvites: EmbedGroup;
		RemoveInvites: EmbedGroup;
		ClearInvites: EmbedGroup;
	};
	ReactionRoles: {
		Removed: EmbedGroup;
		Added: EmbedGroup;
		AddCommand: EmbedGroup;
		RemoveCommand: EmbedGroup;
	};
	TempRoles: {
		CheckTimeEmbed: EmbedGroup & { Expired: string };
	};
	Roles: {
		Added: EmbedGroup;
		Removed: EmbedGroup;
	};
	Tickets: {
		MULTI_BUTTONS_TICKETS: EmbedGroup & { Timestamp: boolean; Banner: string };
		DROPDOWN_TICKET_PANEL: EmbedGroup & { Timestamp: boolean; Banner: string };
		TICKET_OPEN_REASON_ENABLED: EmbedGroup;
		TICKET_OPEN_REASON_DISABLED: EmbedGroup;
	};
	BLACKLIST: {
		BLACKLISTED: EmbedGroup;
		USERBLACKLISTED: EmbedGroup;
		UNBLACKLIST: {
			UNBLACKLISTED: EmbedGroup;
			USERUNBLACKLISTED: EmbedGroup;
		};
		CHECKBLACKLIST: {
			BLACKLISTED: EmbedGroup;
			NOBLACKLISTED: EmbedGroup;
		};
	};
}

export interface ButtonConfig {
	Style: string;
	Label: string;
	Emoji: string;
}

export interface Buttons {
	MULTI_BUTTONS_TICKETS: {
		Style: string;
	};
	TICKETS_GENERAL_BUTTONS: {
		Close: ButtonConfig;
		Claim: ButtonConfig;
		Transcript: ButtonConfig;
		Re_Open: ButtonConfig;
		Delete: ButtonConfig;
	};
}

export interface MusicStrings {
	PlaySong: string;
	AddSong: string;
	AddList: string;
	Loop: { Off: string; RepeatOne: string; RepeatQueue: string };
	NowPlaying: {
		Nothing: string;
		EmbedColor: string;
		EmbedTitle: string;
		EmbedDescription: string;
		FieldOne: { Name: string; Value: string; inline: boolean };
		FieldTwo: { Name: string; Value: string; inline: boolean };
	};
	Pause: { MustBeInVC: string; Nothing: string; AlreadyPaused: string; Paused: string };
	Play: { NoLinkProvided: string; MustBeInVC: string; Searching: string };
	Queue: {
		NoSongPlaying: string;
		MustBeInVC: string;
		SameVC: string;
		OnlyExecutor: string;
		CollectorExpired: string;
	};
	Resume: { MustBeInVC: string; NoQueue: string; NotPaused: string; Resumed: string };
	Seek: { NoMusic: string; InvalidTime: string; SeekedTo: string };
	Shuffle: { NoMusic: string; Shuffled: string };
	Skip: { NoVoiceChannel: string; NoQueue: string; Skipped: string };
	Stop: { NoVoiceChannel: string; NoQueue: string; Stopped: string };
	Volume: { NoQueue: string; SetVolume: string };
}

export interface Language {
	NO_PERMSBOT: string;
	NO_PERMS: string;
	NO_PERMSUSER: string;
	NO_PERMSROLEHIGHER: string;
	DISABLED_COMMAND: string;
	Invites: {
		hasInvites: string;
		noHasInvites: string;
		cooldown: string;
	};
	TempRoles: {
		Added: string;
		ErrorWhenAdding: string;
		Removed: string;
		ErrorWhenRemoving: string;
		NotFoundRoles: string;
		CheckExpiredRoles: string;
	};
	Roles: {
		Already: string;
		NoHaveRole: string;
	};
	Tickets: {
		TicketRenamed: string;
		NoPerms: string;
		TicketClosedBy: string;
		TicketCreating: string;
		TicketCreated: string;
		WhatDoYouWant: string;
		TicketConfirmation: string;
		TicketClaimed: string;
		TicketReopen: string;
		TicketClosed: string;
		TicketDeleted: string;
		NoTicket: string;
		AlreadyOpen: string;
		AlertMessage: string;
		AlertSent: string;
	};
	TicketReason: {
		Label: string;
		Placeholder: string;
	};
	Music: MusicStrings;
	Economy: {
		MoneyAdded: string;
		ItemBought: string;
		NotEnoughMoney: string;
		NoCollectRoles: string;
		DailyAlreadyClaimed: string;
		DepositSuccess: string;
		NotEnoughWalletMoney: string;
		BotsMoney: string;
		RemoveMoneySuccess: string;
		UserNotEnoughMoney: string;
		AmountMustBePositive: string;
		EconomyReset: string;
		EconomyResetUser: string;
		RobberyFailed: string;
		RobberySuccess: string;
		RobberyTargetNotEnoughMoney: string;
		ShopItemRemoved: string;
		ShopItemAdded: string;
		ShopItemExists: string;
		WithdrawSuccess: string;
		WithdrawNotEnoughBank: string;
		WithdrawInvalidAmount: string;
		WorkSuccess: string;
	};
}
