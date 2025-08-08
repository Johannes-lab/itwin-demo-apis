export interface iTwin {
  id: string;
  class: string;
  subClass: string;
  type: string | null;
  number: string;
  displayName: string;
  status: string;
}

export interface iTwinsResponse {
  iTwins: iTwin[];
  _links: {
    self: { href: string };
    next?: { href: string };
  };
}
