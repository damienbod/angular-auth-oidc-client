export interface PopupResultUserClosed {
  userClosed: true;
}

export interface PopupResultReceivedUrl {
  userClosed: false;
  receivedUrl: string;
}

export type PopupResult = PopupResultUserClosed | PopupResultReceivedUrl;
