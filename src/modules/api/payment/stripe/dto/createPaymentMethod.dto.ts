import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import Stripe from 'stripe';

export class CreatePaymentMethodDto
  implements Stripe.PaymentMethodCreateParams
{
  @ApiProperty({ required: false })
  acss_debit?: Stripe.PaymentMethodCreateParams.AcssDebit;

  @ApiProperty({ required: false })
  affirm?: Stripe.PaymentMethodCreateParams.Affirm;

  @ApiProperty({ required: false })
  afterpay_clearpay?: Stripe.PaymentMethodCreateParams.AfterpayClearpay;

  @ApiProperty({ required: false })
  alipay?: Stripe.PaymentMethodCreateParams.Alipay;

  @ApiProperty({ required: false })
  au_becs_debit?: Stripe.PaymentMethodCreateParams.AuBecsDebit;

  @ApiProperty({ required: false })
  bacs_debit?: Stripe.PaymentMethodCreateParams.BacsDebit;

  @ApiProperty({ required: false })
  bancontact?: Stripe.PaymentMethodCreateParams.Bancontact;

  @ApiProperty({ required: false })
  billing_details?: Stripe.PaymentMethodCreateParams.BillingDetails;

  @ApiProperty({ required: false })
  boleto?: Stripe.PaymentMethodCreateParams.Boleto;

  @ApiProperty({ required: false })
  card?: Stripe.PaymentMethodCreateParams.Card;

  @ApiProperty({ required: false })
  customer?: string;

  @ApiProperty({ required: false })
  customer_balance?: Stripe.PaymentMethodCreateParams.CustomerBalance;

  @ApiProperty({ required: false })
  eps?: Stripe.PaymentMethodCreateParams.Eps;

  @ApiProperty({ required: false })
  expand?: Array<string>;

  @ApiProperty({ required: false })
  fpx?: Stripe.PaymentMethodCreateParams.Fpx;

  @ApiProperty({ required: false })
  giropay?: Stripe.PaymentMethodCreateParams.Giropay;

  @ApiProperty({ required: false })
  grabpay?: Stripe.PaymentMethodCreateParams.Grabpay;

  @ApiProperty({ required: false })
  ideal?: Stripe.PaymentMethodCreateParams.Ideal;

  @ApiProperty({ required: false })
  interac_present?: Stripe.PaymentMethodCreateParams.InteracPresent;

  @ApiProperty({ required: false })
  klarna?: Stripe.PaymentMethodCreateParams.Klarna;

  @ApiProperty({ required: false })
  konbini?: Stripe.PaymentMethodCreateParams.Konbini;

  @ApiProperty({ required: false })
  link?: Stripe.PaymentMethodCreateParams.Link;

  @ApiProperty({ required: false })
  metadata?: Stripe.MetadataParam;

  @ApiProperty({ required: false })
  oxxo?: Stripe.PaymentMethodCreateParams.Oxxo;

  @ApiProperty({ required: false })
  p24?: Stripe.PaymentMethodCreateParams.P24;

  @ApiProperty({ required: false })
  payment_method?: string;

  @ApiProperty({ required: false })
  paynow?: Stripe.PaymentMethodCreateParams.Paynow;

  @ApiProperty({ required: false })
  promptpay?: Stripe.PaymentMethodCreateParams.Promptpay;

  @ApiProperty({ required: false })
  radar_options?: Stripe.PaymentMethodCreateParams.RadarOptions;

  @ApiProperty({ required: false })
  sepa_debit?: Stripe.PaymentMethodCreateParams.SepaDebit;

  @ApiProperty({ required: false })
  sofort?: Stripe.PaymentMethodCreateParams.Sofort;

  @IsNotEmpty()
  @ApiProperty({ required: true })
  type: Stripe.PaymentMethodCreateParams.Type;

  @ApiProperty({ required: false })
  us_bank_account?: Stripe.PaymentMethodCreateParams.UsBankAccount;

  @ApiProperty({ required: false })
  wechat_pay?: Stripe.PaymentMethodCreateParams.WechatPay;
}
