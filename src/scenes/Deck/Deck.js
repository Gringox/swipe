
import React, { Component } from 'react';
import {
    Animated,
    PanResponder,
    View,
    Dimensions,
    LayoutAnimation,
    UIManager
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const SWIPE_OUT_DURATION = 250;

class Deck extends Component {
    static defaultProps = {
        onSwipeRight: () => {},
        onSwipeLeft: () => {}
    }

    constructor(props) {
        super(props);

        const position = new Animated.ValueXY();

        const panResponder = PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (event, gesture) => {
                position.setValue({ x: gesture.dx, y: gesture.dy });
            },
            onPanResponderRelease: (event, gesture) => {
                if (gesture.dx > SWIPE_THRESHOLD) {
                    this.forceSwipe('right');
                } else if (gesture.dx < -SWIPE_THRESHOLD) {
                    this.forceSwipe('left');
                } else {
                    this.resetPosition();
                }
            }
        });

        this.position = position;
        this.panResponder = panResponder;
        this.state = { index: 0 };
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.data !== this.props.data) {
            this.setState({ index: 0 });
        }
    }

    componentWillUpdate() {
        if (UIManager.setLayoutAnimationEnabledExperimental) {
            UIManager.setLayoutAnimationEnabledExperimental(true);
        }
        LayoutAnimation.spring();
    }

    onSwipeComplete(direction) {
        const { onSwipeLeft, onSwipeRight, data } = this.props;
        const item = data[this.state.index];

        if (direction === 'right') {
            onSwipeRight(item);
        } else {
            onSwipeLeft(item);
        }

        this.position.setValue({ x: 0, y: 0 });
        this.setState({ index: this.state.index + 1 });
    }

    getCardStyle() {
        const position = this.position;
        const rotate = position.x.interpolate({
            inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5],
            outputRange: ['-120deg', '0deg', '120deg']
        });

        return {
            ...position.getLayout(),
            transform: [{ rotate }]
        };
    }

    forceSwipe(direction) {
        const x = direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH;
        Animated.timing(this.position, {
            toValue: { x, y: 0 },
            duration: 250
        }).start(() => this.onSwipeComplete(direction));
    }

    resetPosition() {
        Animated.spring(this.position, {
            toValue: { x: 0, y: 0 },
            duration: SWIPE_OUT_DURATION
        }).start();
    }

    renderCards() {
        const { index } = this.state;
        const { data, renderCard, renderNoMoreCards } = this.props;

        if (index >= data.length) {
            return renderNoMoreCards();
        }

        return data.map((item, i) => {
            if (i < index) { return null; }

            if (i === index) {
                return (
                    <Animated.View
                        key={item.id}
                        style={[this.getCardStyle(), styles.cardStyles]}
                        {...this.panResponder.panHandlers}
                    >
                        {renderCard(item)}
                    </Animated.View>
                );
            }

            return (
                <Animated.View
                    key={item.id}
                    style={[styles.cardStyles, { top: 10 * (i - index) }]}
                >
                    {renderCard(item)}
                </Animated.View>
            );
        }).reverse();
    }

    render() {
        return (
            <View>
                {this.renderCards()}
            </View>
        );
    }
}

const styles = {
    cardStyles: {
        position: 'absolute',
        width: SCREEN_WIDTH
    }
};

export default Deck;
