import React from 'react';
import { useLocation } from "react-router-dom";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { faker } from '@faker-js/faker';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export var options = {
  indexAxis: 'y' ,
  elements: {
    bar: {
      borderWidth: 2,
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
        ticks: {
            font: {
                size: 20,
            }
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
    borderWidth: 2
}
  ],
};

export default function DisplayVote() {
  const location = useLocation();
  console.log('Object received:', location.state);

  const vote = location.state.vote;
  
  options.plugins.title.text = vote.header.title;

  const dataTbl = vote.items.map((elt) => {
    const labels = elt.labels;
    var tempData = { labels, datasets: [{label: 'votes', data: data.labels.map(() => faker.datatype.number({ min: 0, max: 100 })), 
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
                            borderWidth: 2}]};
    return tempData;
  });


  return vote.items.map((elt, index) => 
      <Bar options={options} data={dataTbl[index]} />);
}
