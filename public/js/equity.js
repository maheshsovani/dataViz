const chartSize = { width: 1200, height: 650 };
const margin = { left: 100, right: 10, top: 10, botttom: 150 };
const width = chartSize.width - (margin.left + margin.right);
const height = chartSize.height - (margin.top + margin.botttom);
const c = d3.scaleOrdinal(d3.schemeCategory10);

const initChart = () => {
  const svg = d3.select('#chart-area').append('svg')
    .attr('height', chartSize.height)
    .attr('width', chartSize.width);

  const timeG = svg.append('g')
    .attr('class', 'quotes')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  timeG.append('text') //adding x axis label
    .attr('class', 'x axis-label')
    .attr('x', width / 2)
    .attr('y', height + 140)
    .text('TIME');

  timeG.append('text')  //adding x axis label
    .attr('class', 'y axis-label')
    .attr('transform', 'rotate(-90)')
    .attr('x', -(height / 2))
    .attr('y', -60)
    .text('CLOSE');

  timeG.append('g')
    .attr('class', 'y axis');

  timeG.append('g')
    .attr('class', 'x axis')
    .attr('transform', `translate(0,${height})`);

  timeG.selectAll('.x.axis text')
    .attr('transform', 'rotate(-40)')
    .attr('x', -5)
    .attr('y', 10);

  timeG.append("path")
    .attr('class', 'close');

  timeG.append("path")
    .attr('class', 'sma')
}

const updateChart = (quotes) => {
  const svg = d3.select('#chart-area svg');
  const filtered_quotes = _.filter(quotes, "SMA");
  const maxSma = _.maxBy(filtered_quotes, "SMA").SMA;
  const minSma = _.minBy(filtered_quotes, "SMA").SMA;
  const minClose = _.minBy(quotes, "Close").Close;
  const maxClose = _.maxBy(quotes, "Close").Close;

  const y = d3.scaleLinear()
    .domain([Math.min(minSma, minClose), Math.max(maxSma, maxClose)])
    .range([height, 0]);

  const yAxis = d3.axisLeft(y).ticks(10).tickSize(-width);

  svg.select('.y.axis').call(yAxis);

  const startDate = new Date(_.first(quotes).Date);
  const endDate = new Date(_.last(quotes).Date);

  const x = d3.scaleTime()
    .domain([startDate, endDate])
    .range([0, width]);

  const xAxis = d3.axisBottom(x).tickSize(-height);
  svg.select('.x.axis').call(xAxis);

  const line = d3.line().x(q => x(q.Time)).y(q => y(q.Close))

  const line1 = d3.line().x(q => x(q.Time)).y(q => y(q.SMA));

  d3.select(".close").attr('d', line(quotes));
  d3.select(".sma").attr('d', line1(_.filter(quotes, "SMA")));
}

const parseData = function ({ AdjClose, Volume, Date, ...numerics }) {
  _.forEach(numerics, (v, k) => numerics[k] = +v)
  const date = new window.Date(Date)
  return { Date, Time: date, ...numerics }
}

const getTransactionSummary = function (transaction, id) {
  const { buy, sell } = transaction;
  const newId = ++id;
  const income = sell.Close - buy.Close;
  return {
    newId,
    buyDate: buy.Time.toLocaleDateString(),
    buy: Math.round(buy.Close),
    buySma: Math.round(buy.SMA),
    sellDate: sell.Time.toLocaleDateString(),
    sell: Math.round(sell.Close),
    sellSma: Math.round(sell.SMA),
    income: Math.round(income)
  }
}

const createTransactionsTable = function (transaction) {
  const newTransaction = _.filter(_.filter(transaction, "sell"), "buy");
  tr = d3.select(".objecttable tbody") // creating the tr's
    .selectAll("tr")
    .data(newTransaction)
    .enter().append("tr");

  tr.selectAll("td") // creating the td's
    .data(function (d, i) { return Object.values(getTransactionSummary(d, i)) })
    .enter()
    .append("td")
    .text(function (d) {
      return d
    });
}

const getOneTransaction = function (acc, data) {
  if (data.SMA <= data.Close && acc.canBuy) {
    acc.transactions.push({ "buy": data });
    acc.canBuy = false;
    return acc
  }
  if (data.SMA > data.Close && !acc.canBuy) {
    _.last(acc.transactions)["sell"] = data;
    acc.canBuy = true;
    return acc;
  }
  return acc;
}

const getTransactions = function (quotes) {
  const output = quotes.reduce(getOneTransaction, { canBuy: true, transactions: [] }).transactions;
  if (!(_.last(output).sell)) _.last(output)["sell"] = _.last(quotes);
  return output;
}

const getAverage = function (data) {
  let sum = 0;
  _.forEach(_.takeRight(data, 100), (obj => sum += obj.Close));
  return sum / 100;
}

const analyseData = function (quotes) {
  const data = quotes.slice(0);
  while (data.length > 100) {
    quotes[data.length - 1]["SMA"] = getAverage(data);
    data.pop();
  }
  return quotes;
}

const showSelectedDates = function (startDate, endDate) {
  const showElement = document.getElementById("selected-range");
  showElement.innerText = `${startDate.toLocaleDateString()}  - ${endDate.toLocaleDateString()}`;
}
const createTimeRangeSlider = function (analysedData) {
  const dataToBeModified = analysedData.slice(0);
  const slider = createD3RangeSlider(0, analysedData.length - 1, "#slider-container");
  slider.range(0, analysedData.length - 1);
  showSelectedDates(_.first(analysedData).Time, _.last(analysedData).Time);
  slider.onChange((newRange) => {
    showSelectedDates(analysedData[newRange.begin].Time, analysedData[newRange.end].Time);
    updateChart(dataToBeModified.slice(newRange.begin, newRange.end));
  })
}

const summerizeTransaction = function (transactions) {
  const analysedTransactions = transactions.map(getTransactionSummary);
  return analysedTransactions.reduce((acc, transaction) => {
    if (transaction.income > 0) {
      acc.winCount += 1;
      acc.totalWinAmount += transaction.income;
    } else {
      acc.lossCount += 1;
      acc.totalLossAmount += transaction.income;
    }
    return acc;
  }, { totalWinAmount: 0, totalLossAmount: 0, winCount: 0, lossCount: 0 })
}

const showTransactionSummary = function (transactions) {
  const { totalLossAmount, totalWinAmount, winCount, lossCount } = summerizeTransaction(transactions);
  const totalTransactions = transactions.length;
  const averageWin = Math.round(totalWinAmount / winCount);
  const averageLoss = Math.round(Math.abs(totalLossAmount / lossCount));
  const dataToShow = [
    { text: "Total loss amount", totalLossAmount: Math.abs(totalLossAmount) },
    { text: "Total win amount", totalWinAmount },
    { text: "Average win amount", averageWin },
    { text: "Average loss amount", averageLoss },
    { text: "Total transactions", totalTransactions },
    { text: "Win percentage", totalWinPercentage: Math.round(Math.abs(100 * (totalWinAmount / totalTransactions))) },
    { text: "Win multiple", winMultiple: Math.round(Math.abs(averageWin / averageLoss)) },
    { text: "Net amount", netAmount: totalWinAmount + totalLossAmount },
    { text: "Expectancy", expectancy: Math.round(totalWinAmount / totalTransactions) }
  ]
  tr = d3.select(".summary-table tbody")
    .selectAll("tr")
    .data(dataToShow)
    .enter().append("tr");
  var td = tr.selectAll("td")
    .data(function (d, i) { return Object.values(d) })
    .enter()
    .append("td")
    .text(function (d) { return d });
}

const startVisualization = (niftyData) => {
  initChart();
  //analysing data and adding SMA(Simple Moving Average)column
  const analysedData = analyseData(niftyData);
  const transactions = getTransactions(analysedData.slice(100))
  updateChart(analysedData);
  createTimeRangeSlider(analysedData); //creating time range slider
  createTransactionsTable(transactions); //creating transactions table
  showTransactionSummary(transactions);//creating transactions summary
}

const main = () => {
  d3.csv('data/Nifty.csv', parseData).then(startVisualization);
}

window.onload = main;