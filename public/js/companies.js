const chartSize = { width: 800, height: 600 };
const margin = { left: 100, right: 10, top: 10, botttom: 150 };
const width = chartSize.width - (margin.left + margin.right);
const height = chartSize.height - (margin.top + margin.botttom);
const c = d3.scaleOrdinal(d3.schemeCategory10);

const formats = {
  Rs: d => `${d} ₹`,
  kCrRs: d => `${d / 1000}k Cr ₹`,
  Percent: d => `${d}%`
};

const showCompanyDetails = function (companies, step) {
  const [fieldName, format] = configs[step % configs.length];
  const toLine = b => `<strong>${b.Name}</strong> <i>${b[fieldName]}</i>`;
  document.querySelector('#chart-data').innerHTML = companies.map(toLine).join('<hr/>');
}
const configs = [['CMP', formats.Rs], ['MarketCap', formats.kCrRs], ['PE'], ['DivYld', formats.Percent], ['ROCE', formats.Percent]];

const initChart = () => {
  const svg = d3.select('#chart-area').append('svg')
    .attr('height', chartSize.height)
    .attr('width', chartSize.width);

  const companiesG = svg.append('g')
    .attr('class', 'companies')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const xlabel = companiesG.append('text')
    .attr('class', 'x axis-label')
    .attr('x', width / 2)
    .attr('y', height + 140)
    .text('COMPANIES');

  const ylabel = companiesG.append('text')
    .attr('class', 'y axis-label')
    .attr('transform', 'rotate(-90)')
    .attr('x', -(height / 2))
    .attr('y', -60)
    .text('CMP');

  companiesG.append('g')
    .attr('class', 'y axis');

  companiesG.append('g')
    .attr('class', 'x axis')
    .attr('transform', `translate(0,${height})`);

  companiesG.selectAll('.x.axis text')
    .attr('transform', 'rotate(-40)')
    .attr('x', -5)
    .attr('y', 10)
}

const updateChart = (companies, step = 0) => {
  showCompanyDetails(companies, step);
  const [fieldName, format] = configs[step % configs.length];
  const svg = d3.select('#chart-area svg');
  const svgGroup = d3.select('.companies');
  svg.select('.y.axis-label').text(fieldName);

  const y = d3.scaleLinear()
    .domain([0, _.get(_.maxBy(companies, fieldName), fieldName, 0)])
    .range([height, 0]);

  const yAxis = d3.axisLeft(y)
    .ticks(10)
    .tickFormat(format);

  svg.select('.y.axis').call(yAxis);

  const x = d3.scaleBand()
    .domain(_.map(companies, 'Name'))
    .range([0, width])
    .padding(0.3);

  const xAxis = d3.axisBottom(x);
  svg.select('.x.axis').call(xAxis);

  const rects = svgGroup.selectAll('rect')
    .data(companies, c => c.Name)
  
  rects.exit().remove();

  rects.enter().append('rect')
    .attr('fill', b => c(b.Name))
    .attr('y', b => y(0))
    .merge(rects)
    .transition().duration(1000).ease(d3.easeLinear)
    .attr('y', b => y(b[fieldName]))
    .attr('x', c => x(c.Name))
    .attr('height', b => y(0) - y(b[fieldName]))
    .attr('width', x.bandwidth);

  rects.transition().duration(1000).ease(d3.easeLinear)
    .attr('x', c => x(c.Name))
    .attr('y', b => y(b[fieldName]))
    .attr('height', b => y(0) - y(b[fieldName]))
    .attr('width', x.bandwidth)
}

const frequentlyMoveCompanies = (src, dest) => {
  setInterval(() => {
    const c = src.shift();
    if (c) dest.push(c);
    else[src, dest] = [dest, src];

  }, 2000);
}

const startVisualization = (companies) => {
  let step = 1;
  initChart();
  updateChart(companies, step);
  setInterval(() => updateChart(companies, step++), 1000);
  frequentlyMoveCompanies(companies, []);
}

const main = () => {
  d3.csv('data/companies.csv',
    (row) => {
      const others = Object.keys(row).filter(e => e !== "Name")
      others.map(header => row[header] = +row[header])
      return row
    }
  ).then(startVisualization);
}
window.onload = main;