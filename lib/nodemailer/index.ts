import nodemailer from "nodemailer"
import { 
    WELCOME_EMAIL_TEMPLATE, 
    NEWS_SUMMARY_EMAIL_TEMPLATE,
    STOCK_ALERT_UPPER_EMAIL_TEMPLATE,
    STOCK_ALERT_LOWER_EMAIL_TEMPLATE,
    VOLUME_ALERT_EMAIL_TEMPLATE
} from "./templates"
import { NEWS_SUMMARY_EMAIL_PROMPT } from "../inngest/prompts"
import { formatPrice } from "../utils"
import { any, email, string } from "zod"

export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.NODEMAILER_EMAIL!,
        pass: process.env.NODEMAILER_PASSWORD!,
    }
})

export const sendWelcomeEmail = async ({ email , name , intro }: WelcomeEmailData) => {
    const htmlTemplate = WELCOME_EMAIL_TEMPLATE
        .replace('{{name}}', name)
        .replace('{{intro}}', intro);
    
    const mailOptions = {
        from: `"Signalist"  <signalist@kittipong.pro>`,
        to: email,
        subject: `Welcome to Signalist - your stock market toolkit is ready!`,
        text: 'Thanks for joining Signalist',
        html: htmlTemplate,
    }

    await transporter.sendMail(mailOptions);
}

export const sendNewsSummaryEmail = async (
    { email, date, newsContent }: {email: string; date: string; newsContent: string}
): Promise<void> => {
    const htmlTemplate = NEWS_SUMMARY_EMAIL_PROMPT
        .replace('{{date}}', date)
        .replace('{{newsContent}}', newsContent);

    const mailOptions = {
        from: `"Signalist"  <signalist@kittipong.pro>`,
        to: email,
        subject: `Market News Summary Today ${date}`,
        text: `Today's market news summary from Signalist`,
        html: htmlTemplate,
    };

    await transporter.sendMail(mailOptions);
}

export const sendStockAlertEmail = async ({
    email,
    type,
    alertData
}: {
    email: string,
    type: 'upper' | 'lower' | 'volume',
    alertData: any
}) => {
    let htmlTemplate = '';
    let subject = '';

    const timestamp = new Date().toLocaleString('en_US', {timeZone: 'UTC', dateStyle: 'medium', timeStyle: 'short'});

    if(type === "upper"){
        htmlTemplate = STOCK_ALERT_UPPER_EMAIL_TEMPLATE
        .replace(/{{symbol}}/g , alertData.symbol)
        .replace(/{{company}}/g , alertData.company)
        .replace(/{{currentPrice}}/g , formatPrice(alertData.currentPrice))
        .replace(/{{targetPrice}}/g , formatPrice(alertData.targetPrice))
        .replace(/{{timestamp}}/g , timestamp)

        subject = `📈 Alert: ${alertData.symbol} reached upper target ${formatPrice(alertData.threshold)}`
    }
    else if(type === "lower") {
        htmlTemplate = STOCK_ALERT_LOWER_EMAIL_TEMPLATE
        .replace(/{{symbol}}/g , alertData.symbol)
        .replace(/{{company}}/g , alertData.company)
        .replace(/{{currentPrice}}/g , formatPrice(alertData.currentPrice))
        .replace(/{{targetPrice}}/g , formatPrice(alertData.targetPrice))
        .replace(/{{timestamp}}/g , timestamp)

        subject = `📉 Alert: ${alertData.symbol} dropped below ${formatPrice(alertData.threshold)}`;
    }
    else if(type === "volume") {
        htmlTemplate = VOLUME_ALERT_EMAIL_TEMPLATE
        .replace(/{{symbol}}/g , alertData.symbol)
        .replace(/{{company}}/g , alertData.company)
        .replace(/{{currentVolume}}/g , alertData.currentVolume)
        .replace(/{{currentPrice}}/g , formatPrice(alertData.currentPrice))
        .replace(/{{alertMessage}}/g , `Volume exceeded ${alertData.threshold}`)
        .replace(/{{averageVolume}}/g , "N/A")
        .replace(/{{volumeSpike}}/g , "High Activity")
        .replace(/{{priceColor}}/g , alertData.changePercent >= 0 ? "#10b981" : "#ef4444")
        .replace(/{{changeDirection}}/g , alertData.changePercent >= 0 ? "+" : "")
        .replace(/{{changePercent}}/g , alertData.changePercent?.toFixed(2) || "0")
        .replace(/{{timestamp}}/g , timestamp);

        subject = `📊 Volume Alert: High activity detected for ${alertData.symbol}`;
    }

    const mailOptions = {
        from: `"Signalist Alerts" <signalist@kittipong.pro>`,
        to: email,
        subject: subject,
        html: htmlTemplate,
    }

    await transporter.sendMail(mailOptions);
}

