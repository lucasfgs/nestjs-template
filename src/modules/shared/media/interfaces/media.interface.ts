export interface IMediaCreateInput {
  model_type: string;
  model_id: bigint;
  collection_name: string;
  name: string;
  file_name: string;
  mime_type?: string;
  disk: string;
  size: number;
  manipulations: any;
  custom_properties?: any;
  responsive_images?: any;
  order_column?: number;
}

export interface IMedia {
  id: number;
  model_type: string;
  model_id: bigint;
  collection_name: string;
  name: string;
  file_name: string;
  mime_type: string | null;
  disk: string;
  size: number;
  manipulations: any;
  custom_properties: any;
  responsive_images: any;
  order_column: number;
  created_at: Date;
  updated_at: Date;
}

export interface IMediaUpdateInput {
  collection_name?: string;
  name?: string;
  manipulations?: any;
  custom_properties?: any;
  responsive_images?: any;
  order_column?: number;
}
