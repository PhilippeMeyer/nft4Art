/* global BigInt */
import React from 'react';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Card } from '@mui/material';
import { Box } from '@mui/system';
import { faker } from '@faker-js/faker';


import { decodeVote } from './decodeVote';
import * as cst from './constants.js';
import { VolumeMuteSharp } from '@mui/icons-material';
import NavbarManager from "../NavbarManager";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const env = process.env.REACT_APP_ENV;
const httpServer = process.env.REACT_APP_SERVER;
const urlGetVotes = httpServer + "apiV1/vote/getVotes?voteId=";


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
  
  const [nbVotes, setNbVotes] = useState(0);
  const [vote, setVote] = useState({});


  useEffect(() => {
    setVote(JSON.parse(location.state.vote.jsonData));
  }, []);

  useEffect(() => {
    if (vote.header !== undefined) 
      fetch(urlGetVotes + vote.header.id.hex).then ((response) => response.json().then((results) => decodeVotes(results)));
  }, [vote]);

  const decodeVotes = (res) => { 
    var results = [];

    res.forEach((elt) => {
      //console.log(elt);
      const data = JSON.parse(elt.jsonData);
      decodeVote(BigInt(data.data), vote.items);
      vote.items.forEach((itm, index) => results.push({ type: itm.type, index: index, value: itm.value }));
    })

    //console.log('results:', results);
    vote.items.forEach((elt) => {

      switch(elt.type) {
        case cst.chooseLbl:
        case cst.checkboxLbl:
        case cst.optionLbl:
        case cst.sliderLbl:
            elt.voteValue = new Array(elt.nb).fill(0);
            break;
        case cst.dateLbl:
            elt.voteValue = new Array(res.length);
            break;
        case cst.rankingLbl:
            elt.voteValue = new Array(5).fill(0);
      }
    });

    results.forEach((elt, idx) => {
      let mask, temp;

      switch(elt.type) {
        case cst.chooseLbl:
        case cst.checkboxLbl:
        case cst.optionLbl:
          //console.log('nb:', vote.items[elt.index].nb, 'value:', elt.value, ' ', elt.value.toString(2));
          for(let i = 0 ; i < vote.items[elt.index].nb ; i++) {
              mask = 1 << i;
              temp = elt.value & mask;
              //console.log(mask.toString(2), ' result: ', temp);
              if (temp != 0) vote.items[elt.index].voteValue[i]++; 
            }
            break;
        case cst.sliderLbl:
        case cst.rankingLbl:
            vote.items[elt.index].voteValue[elt.value - 1]++;
            break;
        case cst.dateLbl:
            vote.items[elt.index].voteValue[idx] = elt.value;
      }
    })
    //console.log('results:', vote.items);
    setNbVotes(res.length);
  }

  const optionsOfItem = (item) => {

    return {  
      indexAxis: 'y' ,
      elements: {
        bar: {
          borderWidth: 10,
          barThickness: 10,   // number (pixels) or 'flex'
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
          text: item.label,
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
  // TODO Display images see chart.js-plugin-labels
  //    if( elt.type == 'ranking' ) {
  //      tempOption.plugins.labels = {
  //        render: 'image',
  //        images: [{src: './1star.png', height:10}, {src: './2stars.png', height:10}, {src: './3stars.png', height:10}, {src: './4stars.png', height:10}, {src: './5stars.png', height:10},]
  //      }
  //   }
  };

  const formatTime = (time) => {
    var d = new Date(time)
    return (("0" + d.getDate()).slice(-2) + "-" + ("0"+(d.getMonth()+1)).slice(-2) + "-" + d.getFullYear());      
  }


  const dataOfItem = (elt) => {
    let labels = elt.labels;
    if (elt.type == 'ranking') labels = ['1', '2', '3', '4', '5'];
    if (elt.type == 'slider') labels = Array.from({ length: elt.nb }).map((e, index) => (index + 1).toString());

    var tempData = { labels, datasets: [{label: 'votes', data: elt.voteValue, 
                                  backgroundColor: backcolor,  borderColor: bordercolor,
                                  maxBarThickness: 60, borderWidth: 2,  }]};
    return tempData;
  };

  if (nbVotes === 0) return <><h1 className="title">No vote for this questionnaire</h1></>;
  else
    return (
      <Box sx={{ display: 'block',  alignItems: 'center', justifyContent: 'center', m: 10 }}>
        <h1 className="title">Vote results</h1><br/><hr/>
        <h2 className="subTitle">Vote taking place from: {formatTime(vote.header.start)} to: {formatTime(vote.header.end)}</h2>
        <h2>{nbVotes} votes recorded</h2>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }} >
          {vote.items.map((elt, index) => (
            <Card sx={{width: 2/5, m:5, p:5}} key={'box'+index}>
              <Bar options={optionsOfItem(elt)} data={dataOfItem(elt)} key={'chart'+index}/>
            </Card>))}
        </Box>
        <NavbarManager />
      </Box>);
}
