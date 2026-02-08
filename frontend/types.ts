
export interface ShopBase {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  new_girls_last_15_days?: boolean;
  badge_text: string;
}

export interface ShopCreate extends ShopBase {
  pictures: File[];  
}

export interface Shop extends ShopBase {
  id: number;
  pictures: PictureDTO[];
}

export interface PictureDTO {
  id: number;
  url: string;
}

export interface ShopEdit extends Shop {
  newPictures: File[];
  removePictureIds: number[];
}

export interface UserLocation {
  lat: number;
  lng: number;
}
