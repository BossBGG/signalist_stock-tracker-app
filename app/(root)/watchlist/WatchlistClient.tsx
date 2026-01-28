"use client";

import React, { useState } from 'react';
import WatchlistTable from '@/components/WatchlistTable';
import SearchCommand from '@/components/SearchCommand';
import CreateAlertModal from '@/components/CreateAlertModal';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import AlertsList from '@/components/AlertList';
import { symbol } from 'zod';
import { toast } from 'sonner';
import { deleteAlert } from '@/lib/actions/alert.actions';
import { useRouter } from 'next/navigation';

interface Props {
    watchlist: any[];
    alerts: any[];
    news: any[];
    initalStocks : any[];
}

const WatchlistClient = ({ watchlist , alerts , news , initalStocks }: Props) => {
    const router = useRouter();
    const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
    const [selectedStockForAlert, setSelectedStockForAlert] = useState<{symbol: string, company: string} | undefined>(undefined);

    const [editingAlert, setEditingAlert] = useState<Alert | undefined>(undefined);

    const handleEditAlert = (alert: Alert) => {
        setEditingAlert(alert);
        setSelectedStockForAlert(undefined);
        setIsAlertModalOpen(true);
    };

    const handleDeleteAlert = async (alertId: string) => {
        try {
            const result = await deleteAlert(alertId);
            if(result.success) {
                toast.success("Alert deleted successfully");
                router.refresh();
            } else {
                toast.error("Failed to delete alert");
            }
        } catch (error) {
            toast.error("An error occurred")
        }
    }

    const handleOpenAlertModal = (symbol?: string, company?: string) => {
        setEditingAlert(undefined);
        if(symbol && company) {
            setSelectedStockForAlert({ symbol, company });
        } else {
            setSelectedStockForAlert(undefined);
        }
        setIsAlertModalOpen(true);
    };

    return  (
        <>
        <div className="flex flex-col lg:flex-row gap-8 min-h-[600px]">
            {/* Left: Watchlist Table */}
            <div className="watchlist flex flex-col flex-1 min-w-0">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="watchlist-title">Watchlist</h2>
                    <div className="w-fit">
                        <SearchCommand
                            renderAs='button'
                            label='Add Stock'
                            initialStocks={initalStocks}
                        />
                    </div>
                </div>

                <div className="flex-1 min-h-[400px] max-h-[calc(100vh-200px)] overflow-auto bg-gray-800 rounded-lg border border-gray-600 relative">
                    <WatchlistTable
                        watchlist={watchlist}
                        onAddAlert={handleOpenAlertModal}
                    />
                </div>
            </div>

            {/* Right: Alerts List */}
            <div className="flex flex-col w-full lg:w-[350px] xl:w-[400px] lg:flex-shrink-0">
                <div className="flex justify-between items-center  mb-6">
                    <h2 className="watchlist-title">Alerts</h2>
                    <div className="w-fit">
                        <Button
                            onClick={() => handleOpenAlertModal()}
                            className="create-btn"
                        >
                            Create Alert
                        </Button>
                    </div>
                </div>

                <div className="flex-1 min-h-[400px] max-h-[calc(100vh-200px)] overflow-hidden bg-gray-800 rounded-lg border border-gray-600 relative">
                    <AlertsList 
                    alertData={alerts}
                    watchlist={watchlist}
                    onEditAlert={handleEditAlert}
                    onDeleteAlert={handleDeleteAlert}
                    />
                </div>
            </div>
        </div>

        {/* Bottom: News Grid */}
        <section className="mt-10">
            <div className="flex justify-between items-center mb-6">
                <h2 className="watchlist-title">News</h2>
            </div>
            <div className="watchlist-news">
                {news.map((item, index) => (
                    <Link href={item.url} target='_blank' key={`${item.id}-${index}`} className="news-item group"> 
                        <div className='news-tag'>
                            {item.related}
                        </div>
                        <h3 className="news-title group-hover:text-yellow-500 transition-colors">
                            {item.headline}
                        </h3>
                        <div className="news-meta">
                            <span>
                                {item.source}
                            </span>
                            <span className='mx-2'>
                                •
                            </span>
                            <span>
                                {new Date(item.datetime * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' })}
                            </span>
                        </div>
                        <p className='news-summary mt-3'>
                            {item.summary}
                        </p>
                        <div className="mt-4 flex justify-end">
                            <span className="news-cta">Read More</span>
                        </div>
                    </Link>
                ))}
            </div>
        </section>

        {/* Alert Modal */}
        <CreateAlertModal
            open={isAlertModalOpen}
            setOpen={setIsAlertModalOpen}
            watchlist={watchlist}
            defaultSymbol={selectedStockForAlert?.symbol}
            defaultCompany={selectedStockForAlert?.company}
            editData={editingAlert}
        />
        </>
    );
};

export default WatchlistClient;