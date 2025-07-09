from flask import Flask, request, jsonify
import MetaTrader5 as mt5
import pandas as pd
from datetime import datetime, timedelta

app = Flask(__name__)

def calculate_metrics(trades_df, account_info):
    # Ensure trades_df is not empty
    if trades_df.empty:
        return {
            'default': [
                {'name': 'Lots', 'value': 0, 'isCustom': False},
                {'name': 'Avg. RRR', 'value': 0, 'isCustom': False},
                {'name': 'Win Rate', 'value': 0, 'isCustom': False},
                {'name': 'Loss Rate', 'value': 0, 'isCustom': False},
                {'name': 'Profit Factor', 'value': 0, 'isCustom': False},
                {'name': 'Best Trade', 'value': 0, 'isCustom': False},
                {'name': 'Worst Trade', 'value': 0, 'isCustom': False},
                {'name': 'Long Won', 'value': 0, 'isCustom': False},
                {'name': 'Short Won', 'value': 0, 'isCustom': False},
                {'name': 'Gross Profit', 'value': 0, 'isCustom': False},
                {'name': 'Gross Loss', 'value': 0, 'isCustom': False},
                {'name': 'Average Trade Duration', 'value': '0h', 'isCustom': False},
                {'name': 'Average Profit per Trade', 'value': 0, 'isCustom': False},
                {'name': 'Average Loss per Trade', 'value': 0, 'isCustom': False},
            ],
            'custom': [
                {'name': 'Custom ROI', 'value': ((account_info.profit / account_info.balance) * 100) if account_info.balance > 0 else 0, 'isCustom': True},
            ]
        }

    # Filter profitable and losing trades
    profitable_trades = trades_df[trades_df['profit'] > 0]
    losing_trades = trades_df[trades_df['profit'] < 0]

    # Total trades
    total_trades = len(trades_df)

    # Lots (sum of trade volumes)
    lots = trades_df['volume'].sum() if not trades_df.empty else 0

    # Win Rate and Loss Rate
    win_rate = (len(profitable_trades) / total_trades * 100) if total_trades > 0 else 0
    loss_rate = (len(losing_trades) / total_trades * 100) if total_trades > 0 else 0

    # Profit Factor (Gross Profit / Gross Loss, where Gross Loss is absolute)
    gross_profit = profitable_trades['profit'].sum()
    gross_loss = abs(losing_trades['profit'].sum())
    profit_factor = (gross_profit / gross_loss) if gross_loss > 0 else 0

    # Best and Worst Trade
    best_trade = profitable_trades['profit'].max() if not profitable_trades.empty else 0
    worst_trade = losing_trades['profit'].min() if not losing_trades.empty else 0

    # Long Won and Short Won (based on trade type)
    long_trades = trades_df[trades_df['entry'] == mt5.ORDER_TYPE_BUY]
    short_trades = trades_df[trades_df['entry'] == mt5.ORDER_TYPE_SELL]
    long_won = (len(long_trades[long_trades['profit'] > 0]) / len(long_trades) * 100) if len(long_trades) > 0 else 0
    short_won = (len(short_trades[short_trades['profit'] > 0]) / len(short_trades) * 100) if len(short_trades) > 0 else 0

    # Average Trade Duration (in hours, approximate)
    trade_durations = [(trade.time_update - trade.time_setup) for trade in trades_df.itertuples() if hasattr(trade, 'time_update') and hasattr(trade, 'time_setup')]
    avg_duration_seconds = sum(trade_durations) / len(trade_durations) if trade_durations else 0
    avg_duration_hours = str(timedelta(seconds=avg_duration_seconds)).split('.')[0] if avg_duration_seconds > 0 else '0h'

    # Average Profit and Loss per Trade
    avg_profit_per_trade = profitable_trades['profit'].mean() if not profitable_trades.empty else 0
    avg_loss_per_trade = losing_trades['profit'].mean() if not losing_trades.empty else 0

    # Avg. RRR (Risk-Reward Ratio) - Simplified approximation
    # Requires entry/exit prices and stop-loss/take-profit levels for accuracy
    # Using a placeholder based on profit/loss ratio
    avg_rrr = (abs(avg_profit_per_trade) / abs(avg_loss_per_trade)) if avg_loss_per_trade != 0 else 0

    return {
        'default': [
            {'name': 'Lots', 'value': lots, 'isCustom': False},
            {'name': 'Avg. RRR', 'value': avg_rrr, 'isCustom': False},
            {'name': 'Win Rate', 'value': win_rate, 'isCustom': False},
            {'name': 'Loss Rate', 'value': loss_rate, 'isCustom': False},
            {'name': 'Profit Factor', 'value': profit_factor, 'isCustom': False},
            {'name': 'Best Trade', 'value': best_trade, 'isCustom': False},
            {'name': 'Worst Trade', 'value': worst_trade, 'isCustom': False},
            {'name': 'Long Won', 'value': long_won, 'isCustom': False},
            {'name': 'Short Won', 'value': short_won, 'isCustom': False},
            {'name': 'Gross Profit', 'value': gross_profit, 'isCustom': False},
            {'name': 'Gross Loss', 'value': gross_loss, 'isCustom': False},
            {'name': 'Average Trade Duration', 'value': avg_duration_hours, 'isCustom': False},
            {'name': 'Average Profit per Trade', 'value': avg_profit_per_trade, 'isCustom': False},
            {'name': 'Average Loss per Trade', 'value': avg_loss_per_trade, 'isCustom': False},
        ],
        'custom': [
            {'name': 'Custom ROI', 'value': ((account_info.profit / account_info.balance) * 100) if account_info.balance > 0 else 0, 'isCustom': True},
            {'name': 'Equity to Balance Ratio', 'value': ((account_info.equity / account_info.balance) * 100) if account_info.balance > 0 else 0, 'isCustom': True},
            {'name': 'Margin Level', 'value': account_info.margin_level if account_info.margin_level > 0 else 0, 'isCustom': True},
        ]
    }

@app.route('/connect', methods=['POST'])
def connect_mt5():
    data = request.json
    login = int(data.get('login'))
    password = data.get('password')
    server = data.get('server')
    path = data.get('path', r"C:\Users\Administrator\AppData\Roaming\MetaTrader 5\terminal64.exe")

    if not all([login, password, server]):
        return jsonify({'success': False, 'error': 'Missing required credentials'}), 400

    # Shutdown any existing connection
    mt5.shutdown()

    if not mt5.initialize(path=path, login=login, password=password, server=server):
        error = mt5.last_error()
        print(f"MT5 init failed: {error}")
        return jsonify({'success': False, 'error': str(error)}), 400

    account_info = mt5.account_info()
    if account_info is None:
        error = mt5.last_error()
        print(f"Failed to get account info: {error}")
        mt5.shutdown()
        return jsonify({'success': False, 'error': str(error)}), 400

    # Fetch trade history (last 30 days of deals)
    history = mt5.history_deals_get(datetime.now() - timedelta(days=30), datetime.now())
    if history is None:
        trades_df = pd.DataFrame()
    else:
        trades_df = pd.DataFrame(list(history), columns=history[0]._asdict().keys())

    # Calculate metrics
    metrics = calculate_metrics(trades_df, account_info)

    # Disconnect after fetching data
    mt5.shutdown()

    return jsonify({
        'success': True,
        'metrics': metrics
    }), 200

@app.route('/shutdown', methods=['POST'])
def shutdown_mt5():
    mt5.shutdown()
    return jsonify({'success': True}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002)