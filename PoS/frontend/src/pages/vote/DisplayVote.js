import React from 'react';
import { useLocation } from 'react-router-dom';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Card } from '@mui/material';
import { Box } from '@mui/system';
import { faker } from '@faker-js/faker';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const retroMetro = ['#ea5545', '#f46a9b', '#ef9b20', '#edbf33', '#ede15b', '#bdcf32', '#87bc45', '#27aeef', '#b33dc6'];
const springPastel = ['#fd7f6f', '#7eb0d5', '#b2e061', '#bd7ebe', '#ffb55a', '#ffee65', '#beb9db', '#fdcce5', '#8bd3c7'];

const backcolor = ['rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)', 'rgba(75, 192, 192, 0.6)', 'rgba(153, 102, 255, 0.6)',  'rgba(255, 159, 64, 0.6)'];
const bordercolor = ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)', 'rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)']

export var options = {
  indexAxis: 'y' ,
  elements: {
    bar: {
      borderWidth: 10,
      barThickness: 10,  // number (pixels) or 'flex'
      maxBarThickness: 20 // number (pixels)
    },
  },
  responsive: true,
  plugins: {
    legend: {
      position: 'right',
      display: false
    },
    title: {
      display: true,
      text: '',
      font: { size: 24 }
    },

  },
  scales: {
    y: {
      afterFit(scale) { scale.width = 250; },
      ticks: {
          font: { size: 20, }
      }
    }
  }
};

const labels = ['Question 1', 'Question 2', 'Very long question to see how it works', 'Question 4'];

export var data = {
  labels,
  datasets: [
    {
      label: '# of Votes',
      data: labels.map(() => faker.datatype.number({ min: 0, max: 100 })),
      backgroundColor: [
        'rgba(255, 99, 132, 0.6)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 206, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)',
        'rgba(153, 102, 255, 0.6)',
        'rgba(255, 159, 64, 0.6)'
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)'
      ],
      borderWidth: 1,
      barThickness: 5,  // number (pixels) or 'flex'
      maxBarThickness: 10 // number (pixels)
    }
  ],
};

export default function DisplayVote() {
  const location = useLocation();
  console.log('Object received:', location.state);

  const vote = JSON.parse(location.state.vote.jsonData);
  console.log('vote:', vote);
  
  options.plugins.title.text = vote.header.title;
  const optionsTbl = vote.items.map((elt) => {

    let tempOption = {  
      indexAxis: 'y' ,
      elements: {
        bar: {
          borderWidth: 10,
          barThickness: 10,  // number (pixels) or 'flex'
          maxBarThickness: 20 // number (pixels)
        },
      },
      responsive: true,
      plugins: {
        legend: {
          position: 'right',
          display: false
        },
        title: {
          display: true,
          text: elt.label,
          font: { size: 24 }
        },

      },
      scales: {
        y: {
          afterFit(scale) { scale.width = 150; },
          ticks: {
              font: { size: 20, }
          }
        }
      }
    };
// Display images see chart.js-plugin-labels
//    if( elt.type == 'ranking' ) {
//      tempOption.plugins.labels = {
//        render: 'image',
//        images: [{src: './1star.png', height:10}, {src: './2stars.png', height:10}, {src: './3stars.png', height:10}, {src: './4stars.png', height:10}, {src: './5stars.png', height:10},]
//      }
//   }
    return tempOption;
  });

  function formatTime(time) {
    var d = new Date(time)
    return (("0" + d.getDate()).slice(-2) + "-" + ("0"+(d.getMonth()+1)).slice(-2) + "-" + d.getFullYear());      
  }


  console.log('options:',optionsTbl);

  const dataTbl = vote.items.map((elt) => {
    let labels = elt.labels;
    if( elt.type == 'ranking' ) {
      let labels = Array.from({ length: 5 }).map((e, index) => index + 1);
      var tempData = { labels, datasets: [{label: 'votes', data: Array.from({ length: 5 }).map(() => faker.datatype.number({ min: 0, max: 100 })), 
                                  backgroundColor: backcolor,  borderColor: bordercolor,
                                  maxBarThickness: 60, borderWidth: 2,  }]};
    } else if ( elt.type == 'slider' ) {
      let labels = Array.from({ length: elt.nb }).map((e, index) => index + 1);
      var tempData = { labels, datasets: [{label: 'votes', data: Array.from({ length: elt.nb }).map(() => faker.datatype.number({ min: 0, max: 100 })), 
                                  backgroundColor: backcolor,  borderColor: bordercolor,
                                  maxBarThickness: 60, borderWidth: 2,  }]};
    } else {
      var tempData = { labels, datasets: [{label: 'votes', data: labels.map(() => faker.datatype.number({ min: 0, max: 99 })), 
                                  backgroundColor: backcolor,  borderColor: bordercolor,
                                  maxBarThickness: 60, borderWidth: 2,  }]};
    }
    return tempData;
  });
  console.log('data:', dataTbl);


  return (
    <Box sx={{ display: 'block',  alignItems: 'center', justifyContent: 'center', m: 10 }}>
      <h1>Vote results</h1><br/><hr/>
      <h2>Vote taking place from: {formatTime(vote.header.start)} to: {formatTime(vote.header.end)}</h2>
      <h2>xxx votes recorded</h2>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }} >
        {vote.items.map((elt, index) => (
          <Card sx={{width: 2/5, m:5, p:5}}>
            <Bar options={optionsTbl[index]} data={dataTbl[index]} key={index}/>
          </Card>))}
      </Box>
    </Box>);
}
